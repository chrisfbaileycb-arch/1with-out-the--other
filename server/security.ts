import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { serverConfig, timingSafeEqualStrings, hashSecret, generateSecureToken } from "./config";
import { repository } from "./repository";

export interface ActiveSession {
  sessionId: string;
  user: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  csrfToken: string;
}

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

// In-memory active sessions & clearances (with server-side expiration)
const ACTIVE_SESSIONS = new Map<string, ActiveSession>();
const ACTIVE_CLEARANCES = new Map<string, SecurityClearanceRecord>();

// Rate Limiter tracking state
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const FAILED_PASSCODE_ATTEMPTS = new Map<string, RateLimitEntry>();
const GENERAL_RATE_LIMITS = new Map<string, RateLimitEntry>();

// Clean up expired sessions and rate limits every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of ACTIVE_SESSIONS.entries()) {
    if (session.expiresAt <= now) {
      ACTIVE_SESSIONS.delete(id);
    }
  }
  for (const [id, clearance] of ACTIVE_CLEARANCES.entries()) {
    if (new Date(clearance.expiresAt).getTime() <= now) {
      ACTIVE_CLEARANCES.delete(id);
    }
  }
  for (const [ip, entry] of FAILED_PASSCODE_ATTEMPTS.entries()) {
    if (entry.resetAt <= now) {
      FAILED_PASSCODE_ATTEMPTS.delete(ip);
    }
  }
  for (const [key, entry] of GENERAL_RATE_LIMITS.entries()) {
    if (entry.resetAt <= now) {
      GENERAL_RATE_LIMITS.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Validates Defense-of-Break Passcode safely.
 * - Constant-time comparison
 * - Expiration and revocation checks
 * - Strict exact hash match (no prefix matching)
 * - Rate limiting against brute force
 */
export async function verifyAndAuthorizePasscode(
  rawPasscode: string,
  projectName?: string,
  scope?: string,
  clientIp: string = "unknown",
  sessionId?: string | null
): Promise<{ success: boolean; clearance?: SecurityClearanceRecord; error?: string; statusCode: number }> {
  const now = Date.now();

  // 1. Check Rate Limit for this IP (max 5 failed attempts per 15 minutes)
  const rateKey = `passcode:${clientIp}`;
  const rateEntry = FAILED_PASSCODE_ATTEMPTS.get(rateKey);
  if (rateEntry && rateEntry.resetAt > now) {
    if (rateEntry.count >= 5) {
      const waitMinutes = Math.ceil((rateEntry.resetAt - now) / 60000);
      return {
        success: false,
        error: `Too many failed passcode attempts. Locked out for ${waitMinutes} minutes.`,
        statusCode: 429,
      };
    }
  }

  if (!rawPasscode || typeof rawPasscode !== "string" || !rawPasscode.trim()) {
    return {
      success: false,
      error: "Passcode is required and must be non-empty.",
      statusCode: 400,
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
    // Record failed attempt
    const current = FAILED_PASSCODE_ATTEMPTS.get(rateKey);
    if (!current || current.resetAt <= now) {
      FAILED_PASSCODE_ATTEMPTS.set(rateKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      current.count += 1;
    }

    // Persist authorization failure event
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
  FAILED_PASSCODE_ATTEMPTS.delete(rateKey);

  // 5. Generate secure clearance token and record
  const clearanceId = `clr-${generateSecureToken(8)}`;
  const clearanceToken = generateSecureToken(32);
  const durationMs = 8 * 60 * 60 * 1000; // 8 hours clearance window
  const expiresAt = new Date(now + durationMs).toISOString();
  const issuedAt = new Date(now).toISOString();

  const clearance: SecurityClearanceRecord = {
    clearanceId,
    clearanceToken,
    isCleared: true,
    projectName: projectName?.trim() || "Allowlisted Project Entity",
    authorizedScope: matchedCredential.scope || scope || "Corporate Restructuring & Compliance Operations",
    issuedAt,
    expiresAt,
    revoked: false,
  };

  ACTIVE_CLEARANCES.set(clearanceToken, clearance);

  // Persist authorization success event
  await repository.saveAuthorizationEvent({
    id: `auth-grant-${generateSecureToken(8)}`,
    clearanceId,
    eventType: "GRANTED",
    projectName: clearance.projectName,
    scope: clearance.authorizedScope,
    success: true,
    reason: "Valid compliance passcode authenticated",
    sessionId: sessionId || null,
    expiresAt,
    createdAt: issuedAt,
  });

  return {
    success: true,
    clearance,
    statusCode: 200,
  };
}

/**
 * Validates a clearance token from request header or body.
 */
export function validateClearanceToken(token?: string): SecurityClearanceRecord | null {
  if (!token) return null;
  const clearance = ACTIVE_CLEARANCES.get(token);
  if (!clearance) return null;
  if (clearance.revoked) return null;
  if (new Date(clearance.expiresAt).getTime() <= Date.now()) {
    ACTIVE_CLEARANCES.delete(token);
    return null;
  }
  return clearance;
}

/**
 * Internal operator login service.
 */
export async function authenticateInternalUser(
  username: string,
  password: string
): Promise<{ success: boolean; session?: ActiveSession; error?: string }> {
  if (!username || !password) {
    return { success: false, error: "Username and password are required." };
  }

  const userMatch = timingSafeEqualStrings(username.trim(), serverConfig.internalAuthUser);
  const passHash = hashSecret(password.trim(), serverConfig.sessionSecret);
  const passMatch = timingSafeEqualStrings(passHash, serverConfig.internalAuthPasswordHash);

  if (!userMatch || !passMatch) {
    return { success: false, error: "Invalid credentials." };
  }

  const sessionId = generateSecureToken(32);
  const csrfToken = generateSecureToken(16);
  const durationMs = 8 * 60 * 60 * 1000; // 8 hours
  const now = Date.now();

  const session: ActiveSession = {
    sessionId,
    user: username.trim(),
    role: "operator",
    createdAt: now,
    expiresAt: now + durationMs,
    csrfToken,
  };

  ACTIVE_SESSIONS.set(sessionId, session);
  return { success: true, session };
}

/**
 * Invalidates a session (Logout).
 */
export function invalidateSession(sessionId: string): void {
  ACTIVE_SESSIONS.delete(sessionId);
}

/**
 * Retrieves an active session.
 */
export function getActiveSession(sessionId?: string): ActiveSession | null {
  if (!sessionId) return null;
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    ACTIVE_SESSIONS.delete(sessionId);
    return null;
  }
  return session;
}

/**
 * Express middleware to enforce authentication on protected internal endpoints.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.["1without_session"] || req.headers["x-session-id"];
  const session = getActiveSession(sessionId as string);

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
 * CSRF Protection Middleware for state-altering requests (POST, PUT, DELETE, PATCH).
 */
export function enforceCsrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  // Require standard custom header for SPA requests to mitigate CSRF
  const requestedWith = req.headers["x-requested-with"];
  const csrfHeader = req.headers["x-csrf-token"];
  const origin = req.headers["origin"] || req.headers["referer"];

  // In standard browser calls from our app, X-Requested-With or X-CSRF-Token or JSON Content-Type is sent
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
 * General API Rate Limiter middleware.
 */
export function apiRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `api:${ip}`;
    const now = Date.now();

    let entry = GENERAL_RATE_LIMITS.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      GENERAL_RATE_LIMITS.set(key, entry);
    } else {
      entry.count += 1;
    }

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Rate limit exceeded. Please slow down requests.",
        code: "RATE_LIMITED",
        retryAfterSeconds: retryAfter,
        requestId: (req as any).id || "req-unknown",
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
