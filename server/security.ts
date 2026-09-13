import { Request, Response, NextFunction } from "express";
import { serverConfig, timingSafeEqualStrings, hashSecret, generateSecureToken } from "./config";
import { repository } from "./repository";
import { getFirebaseAuth } from "./firebase";
import {
  durableSessionStore,
  durableClearanceStore,
  durableRateLimiterStore,
  type DurableSession,
  type DurableClearance,
} from "./durable-stores";

export type ActiveSession = DurableSession;

export interface SecurityClearanceRecord {
  clearanceId: string;
  clearanceToken: string;
  isCleared: boolean;
  projectName: string;
  authorizedScope: string;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
}

/**
 * Validates Defense-of-Break Passcode safely.
 * - Constant-time comparison
 * - Expiration and revocation checks
 * - Strict exact hash match (no prefix matching)
 * - Distributed/durable rate limiting against brute force
 * - Durable clearance storage in Firebase/disk
 */
export async function verifyAndAuthorizePasscode(
  rawPasscode: string,
  projectName?: string,
  scope?: string,
  clientIp: string = "unknown",
  sessionId?: string | null
): Promise<{ success: boolean; clearance?: SecurityClearanceRecord; error?: string; statusCode: number }> {
  // 1. Input validation first (returns 400 for empty or malformed inputs without penalizing rate limits)
  if (!rawPasscode || typeof rawPasscode !== "string" || !rawPasscode.trim()) {
    return {
      success: false,
      error: "Passcode is required and must be non-empty.",
      statusCode: 400,
    };
  }

  const now = Date.now();
  const rateKey = `passcode:${clientIp}`;

  // 2. Check Durable Rate Limit for this IP (max 5 attempts per 15 minutes)
  const rateLimitStatus = await durableRateLimiterStore.checkAndIncrement(rateKey, 5, 15 * 60 * 1000);
  if (!rateLimitStatus.allowed) {
    const waitMinutes = Math.ceil((rateLimitStatus.resetAt - now) / 60000);
    return {
      success: false,
      error: `Too many failed passcode attempts. Locked out for ${waitMinutes} minutes.`,
      statusCode: 429,
    };
  }

  const cleanPass = rawPasscode.trim();
  const passHash = hashSecret(cleanPass);

  // 2. Exact match against configured credentials with constant-time equality
  let matchedCredential = null;
  for (const cred of serverConfig.defensePasscodes) {
    if (timingSafeEqualStrings(passHash, cred.hash)) {
      matchedCredential = cred;
      break;
    }
  }

  if (!matchedCredential) {
    // Record authorization failure event
    const eventId = `auth-fail-${generateSecureToken(8)}`;
    await repository.saveAuthorizationEvent({
      id: eventId,
      clearanceId: "none",
      eventType: "FAILED",
      projectName: projectName || "unspecified",
      scope: scope || "defense_override",
      success: false,
      reason: "Invalid passcode provided",
      sessionId: sessionId || null,
      createdAt: new Date().toISOString(),
    });

    return {
      success: false,
      error: "Invalid or unauthorized Defense-of-Break compliance passcode.",
      statusCode: 401,
    };
  }

  // 3. Check revocation status
  if (matchedCredential.revoked) {
    return {
      success: false,
      error: "This authorization passcode has been revoked by system administrators.",
      statusCode: 403,
    };
  }

  // 4. Check expiration date
  if (matchedCredential.expiresAt && matchedCredential.expiresAt <= now) {
    return {
      success: false,
      error: "This authorization passcode has expired.",
      statusCode: 403,
    };
  }

  // Clear failed attempt counter on success
  await durableRateLimiterStore.resetLimit(rateKey);

  // 5. Generate secure clearance record backed by durable store
  const { clearance: durableClearance, rawToken: clearanceToken } = await durableClearanceStore.issueClearance({
    projectName: projectName?.trim() || "Allowlisted Project Entity",
    scope: matchedCredential.scope || scope || "Corporate Restructuring & Compliance Operations",
    durationMs: 8 * 60 * 60 * 1000,
    operatorId: sessionId || null,
  });

  const clearance: SecurityClearanceRecord = {
    clearanceId: durableClearance.clearanceId,
    clearanceToken,
    isCleared: true,
    projectName: durableClearance.projectName,
    authorizedScope: durableClearance.authorizedScope,
    issuedAt: durableClearance.issuedAt,
    expiresAt: durableClearance.expiresAt,
    revoked: false,
  };

  // Persist authorization success event
  await repository.saveAuthorizationEvent({
    id: `auth-grant-${generateSecureToken(8)}`,
    clearanceId: clearance.clearanceId,
    eventType: "GRANTED",
    projectName: clearance.projectName,
    scope: clearance.authorizedScope,
    success: true,
    reason: "Valid compliance passcode authenticated",
    sessionId: sessionId || null,
    expiresAt: clearance.expiresAt,
    createdAt: clearance.issuedAt,
  });

  return {
    success: true,
    clearance,
    statusCode: 200,
  };
}

/**
 * Validates a clearance token from request header or body.
 * Synchronous version using fast durable local cache.
 */
export function validateClearanceToken(token?: string): SecurityClearanceRecord | null {
  if (!token) return null;
  const tokenHash = hashSecret(token.trim());
  const now = Date.now();

  // Check store
  const cached = (durableClearanceStore as any).localClearances?.get(tokenHash);
  if (!cached) return null;
  if (cached.revoked) return null;
  if (new Date(cached.expiresAt).getTime() <= now) return null;

  return {
    clearanceId: cached.clearanceId,
    clearanceToken: token,
    isCleared: true,
    projectName: cached.projectName,
    authorizedScope: cached.authorizedScope,
    issuedAt: cached.issuedAt,
    expiresAt: cached.expiresAt,
    revoked: cached.revoked,
  };
}

/**
 * Validates a clearance token asynchronously (checks Firestore).
 */
export async function validateClearanceTokenAsync(token?: string): Promise<SecurityClearanceRecord | null> {
  if (!token) return null;
  const durable = await durableClearanceStore.validateClearance(token);
  if (!durable) return null;

  return {
    clearanceId: durable.clearanceId,
    clearanceToken: token,
    isCleared: true,
    projectName: durable.projectName,
    authorizedScope: durable.authorizedScope,
    issuedAt: durable.issuedAt,
    expiresAt: durable.expiresAt,
    revoked: durable.revoked,
  };
}

/**
 * Internal operator login service.
 * Supports both username/password verification and Firebase Auth ID token verification.
 */
export async function authenticateInternalUser(
  username: string,
  password: string,
  clientIp: string = "unknown"
): Promise<{ success: boolean; session?: ActiveSession; error?: string; statusCode?: number }> {
  const rateKey = `login:${clientIp}`;
  const now = Date.now();

  // Rate limit: max 10 failed login attempts per 15 minutes
  const rateCheck = await durableRateLimiterStore.checkAndIncrement(rateKey, 10, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil((rateCheck.resetAt - now) / 60000);
    return {
      success: false,
      error: `Too many failed login attempts. Locked out for ${waitMinutes} minutes.`,
      statusCode: 429,
    };
  }

  if (!username || !password) {
    return { success: false, error: "Username and password are required.", statusCode: 400 };
  }

  const userMatch = timingSafeEqualStrings(username.trim(), serverConfig.internalAuthUser);
  const passHash = hashSecret(password.trim(), serverConfig.sessionSecret);
  const passMatch = timingSafeEqualStrings(passHash, serverConfig.internalAuthPasswordHash);

  if (!userMatch || !passMatch) {
    return { success: false, error: "Invalid operator credentials.", statusCode: 401 };
  }

  // Clear rate limit on successful authentication
  await durableRateLimiterStore.resetLimit(rateKey);

  // Issue durable session
  const session = await durableSessionStore.createSession(username.trim(), "operator");
  return { success: true, session, statusCode: 200 };
}

/**
 * Authenticates using a Firebase Auth ID Token.
 * Verifies the token server-side via Firebase Admin Auth and issues a durable session.
 */
export async function authenticateWithFirebaseToken(
  idToken: string,
  clientIp: string = "unknown"
): Promise<{ success: boolean; session?: ActiveSession; error?: string; statusCode?: number }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return {
      success: false,
      error: "Firebase Authentication is not configured on this server.",
      statusCode: 503,
    };
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const userIdentifier = decoded.email || decoded.uid;
    const role = (decoded.role as "operator" | "admin") || "operator";

    const session = await durableSessionStore.createSession(userIdentifier, role);
    return { success: true, session, statusCode: 200 };
  } catch (err: any) {
    return {
      success: false,
      error: `Firebase token verification failed: ${err.message}`,
      statusCode: 401,
    };
  }
}

/**
 * Invalidates a session (Logout).
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await durableSessionStore.revokeSession(sessionId);
}

/**
 * Retrieves an active session synchronously from durable store cache.
 */
export function getActiveSession(sessionId?: string): ActiveSession | null {
  if (!sessionId) return null;
  const now = Date.now();
  const cached = (durableSessionStore as any).localSessions?.get(sessionId);
  if (!cached) return null;
  if (cached.expiresAt <= now || cached.revoked) return null;
  return cached;
}

/**
 * Retrieves an active session asynchronously (checking Firestore).
 */
export async function getActiveSessionAsync(sessionId?: string): Promise<ActiveSession | null> {
  return durableSessionStore.getSession(sessionId);
}

/**
 * Express middleware to enforce authentication on protected internal endpoints.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.["1without_session"] || req.headers["x-session-id"];
  const session = await durableSessionStore.getSession(sessionId as string);

  if (!session) {
    return res.status(401).json({
      error: "Authentication required for this operational route.",
      code: "AUTH_REQUIRED",
      requestId: (req as any).id || "req-unknown",
      timestamp: new Date().toISOString(),
    });
  }

  (req as any).session = session;
  (req as any).user = session.user;
  next();
}

/**
 * Real authorization middleware specifically protecting /api/admin/* routes.
 * Enforces authenticated operator/admin role and active unrevoked session.
 */
export async function requireOperatorAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.["1without_session"] || req.headers["x-session-id"];
  
  // Check for Bearer Firebase ID token in Authorization header as alternate credential
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    const fbAuth = getFirebaseAuth();
    if (fbAuth) {
      try {
        const decoded = await fbAuth.verifyIdToken(bearerToken);
        (req as any).user = decoded.email || decoded.uid;
        (req as any).role = decoded.role || "operator";
        return next();
      } catch {
        // Fall back to session check
      }
    }
  }

  const session = await durableSessionStore.getSession(sessionId as string);

  if (!session) {
    return res.status(401).json({
      error: "Admin route access denied: Valid operator session required.",
      code: "OPERATOR_AUTH_REQUIRED",
      requestId: (req as any).id || "req-unknown",
      timestamp: new Date().toISOString(),
    });
  }

  if (session.revoked) {
    return res.status(403).json({
      error: "Admin route access denied: Session has been revoked.",
      code: "SESSION_REVOKED",
      requestId: (req as any).id || "req-unknown",
      timestamp: new Date().toISOString(),
    });
  }

  if (session.role !== "operator" && session.role !== "admin") {
    return res.status(403).json({
      error: "Admin route access denied: Insufficient privileges.",
      code: "INSUFFICIENT_ROLE",
      requestId: (req as any).id || "req-unknown",
      timestamp: new Date().toISOString(),
    });
  }

  (req as any).session = session;
  (req as any).user = session.user;
  (req as any).role = session.role;
  next();
}

/**
 * CSRF Protection Middleware for state-altering requests (POST, PUT, DELETE, PATCH).
 */
export function enforceCsrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  const requestedWith = req.headers["x-requested-with"];
  const csrfHeader = req.headers["x-csrf-token"];
  const contentType = req.headers["content-type"] || "";
  const isJson = contentType.includes("application/json");

  if (!isJson && !requestedWith && !csrfHeader) {
    return res.status(403).json({
      error: "Missing required security headers (CSRF protection).",
      code: "CSRF_BLOCKED",
      requestId: (req as any).id || "req-unknown",
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Distributed/Durable Rate Limiter middleware.
 * Backed by Firestore / local persistent store to prevent resetting on restarts.
 */
export function apiRateLimiter(maxRequests: number = 100, windowMs: number = 60000, keyPrefix: string = "api") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    try {
      const result = await durableRateLimiterStore.checkAndIncrement(key, maxRequests, windowMs);
      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - now) / 1000);
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({
          error: "Rate limit exceeded. Please slow down requests.",
          code: "RATE_LIMITED",
          retryAfterSeconds: retryAfter,
          requestId: (req as any).id || "req-unknown",
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // In degraded mode, permit request rather than failing closed
    }

    next();
  };
}
