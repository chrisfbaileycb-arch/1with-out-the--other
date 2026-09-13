import fs from "fs";
import path from "path";
import { getFirestoreDb } from "./firebase";
import { hashSecret, generateSecureToken } from "./config";

export interface DurableSession {
  sessionId: string;
  user: string;
  role: "operator" | "admin" | "auditor";
  createdAt: number;
  issuedAt: string;
  expiresAt: number;
  csrfToken: string;
  revoked: boolean;
  lastActivity: number;
}

export interface DurableClearance {
  clearanceId: string;
  tokenHash: string; // SHA-256 hash of clearance token
  projectName: string;
  authorizedScope: string;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  operatorId?: string | null;
  authorizationEventId?: string | null;
}

export interface DurableRateLimitRecord {
  key: string;
  count: number;
  resetAt: number;
  updatedAt: string;
}

// ─── Local JSON Persistence Helpers ──────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), ".data");

function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fullPath)) return fallback;
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const fullPath = path.join(DATA_DIR, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[1WithOut Storage] Failed to write ${filename}:`, err);
  }
}

// ─── 1. DURABLE SESSION STORE ────────────────────────────────────────────────
export class DurableSessionStore {
  private localSessions: Map<string, DurableSession> = new Map();
  private readonly filename = "durable_sessions.json";

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const list = readJsonFile<DurableSession[]>(this.filename, []);
    this.localSessions.clear();
    const now = Date.now();
    for (const item of list) {
      if (item.expiresAt > now && !item.revoked) {
        this.localSessions.set(item.sessionId, item);
      }
    }
  }

  private saveToDisk(): void {
    writeJsonFile(this.filename, Array.from(this.localSessions.values()));
  }

  async createSession(
    user: string,
    role: "operator" | "admin" | "auditor" = "operator",
    durationMs: number = 8 * 60 * 60 * 1000
  ): Promise<DurableSession> {
    const now = Date.now();
    const sessionId = generateSecureToken(32);
    const csrfToken = generateSecureToken(16);

    const session: DurableSession = {
      sessionId,
      user: user.trim(),
      role,
      createdAt: now,
      issuedAt: new Date(now).toISOString(),
      expiresAt: now + durationMs,
      csrfToken,
      revoked: false,
      lastActivity: now,
    };

    // 1. Persist to local durable disk
    this.localSessions.set(sessionId, session);
    this.saveToDisk();

    // 2. Persist to Firestore if available
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("sessions").doc(sessionId).set(session);
      } catch (err) {
        console.warn("[1WithOut SessionStore] Firestore write warning (saved locally):", err);
      }
    }

    return session;
  }

  async getSession(sessionId?: string): Promise<DurableSession | null> {
    if (!sessionId) return null;
    const now = Date.now();

    // Try Firestore first if available
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await db.collection("sessions").doc(sessionId).get();
        if (snap.exists) {
          const s = snap.data() as DurableSession;
          if (s.expiresAt > now && !s.revoked) {
            // Update last activity periodically
            if (now - s.lastActivity > 60000) {
              db.collection("sessions").doc(sessionId).update({ lastActivity: now }).catch(() => {});
            }
            this.localSessions.set(sessionId, s);
            return s;
          } else {
            return null;
          }
        }
      } catch (err) {
        // Fallback to local session store
      }
    }

    // Fallback to local durable cache
    const cached = this.localSessions.get(sessionId);
    if (!cached) return null;
    if (cached.expiresAt <= now || cached.revoked) {
      this.localSessions.delete(sessionId);
      this.saveToDisk();
      return null;
    }

    cached.lastActivity = now;
    return cached;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const cached = this.localSessions.get(sessionId);
    if (cached) {
      cached.revoked = true;
      this.localSessions.delete(sessionId);
      this.saveToDisk();
    }

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("sessions").doc(sessionId).update({ revoked: true });
      } catch (err) {
        // Ignored if document missing
      }
    }
  }

  async cleanExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, s] of this.localSessions.entries()) {
      if (s.expiresAt <= now || s.revoked) {
        this.localSessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.saveToDisk();
    }
    return cleaned;
  }
}

// ─── 2. DURABLE DEFENSE CLEARANCE STORE ──────────────────────────────────────
export class DurableClearanceStore {
  private localClearances: Map<string, DurableClearance> = new Map();
  private readonly filename = "durable_clearances.json";

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const list = readJsonFile<DurableClearance[]>(this.filename, []);
    this.localClearances.clear();
    const now = Date.now();
    for (const item of list) {
      if (new Date(item.expiresAt).getTime() > now && !item.revoked) {
        this.localClearances.set(item.tokenHash, item);
      }
    }
  }

  private saveToDisk(): void {
    writeJsonFile(this.filename, Array.from(this.localClearances.values()));
  }

  async issueClearance(params: {
    projectName: string;
    scope: string;
    durationMs?: number;
    operatorId?: string | null;
    authorizationEventId?: string | null;
  }): Promise<{ clearance: DurableClearance; rawToken: string }> {
    const now = Date.now();
    const duration = params.durationMs || 8 * 60 * 60 * 1000; // 8 hours
    const rawToken = generateSecureToken(32);
    const tokenHash = hashSecret(rawToken);
    const clearanceId = `clr-${generateSecureToken(8)}`;
    const issuedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + duration).toISOString();

    const clearance: DurableClearance = {
      clearanceId,
      tokenHash,
      projectName: params.projectName,
      authorizedScope: params.scope,
      issuedAt,
      expiresAt,
      revoked: false,
      operatorId: params.operatorId || null,
      authorizationEventId: params.authorizationEventId || null,
    };

    // 1. Local disk persistence
    this.localClearances.set(tokenHash, clearance);
    this.saveToDisk();

    // 2. Firestore persistence (keyed by tokenHash so rawToken is never stored)
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("clearances").doc(tokenHash).set(clearance);
      } catch (err) {
        console.warn("[1WithOut ClearanceStore] Firestore write warning (saved locally):", err);
      }
    }

    return { clearance, rawToken };
  }

  async validateClearance(rawToken?: string): Promise<DurableClearance | null> {
    if (!rawToken || typeof rawToken !== "string") return null;
    const tokenHash = hashSecret(rawToken.trim());
    const now = Date.now();

    // Try Firestore first if available
    const db = getFirestoreDb();
    if (db) {
      try {
        const snap = await db.collection("clearances").doc(tokenHash).get();
        if (snap.exists) {
          const clr = snap.data() as DurableClearance;
          if (new Date(clr.expiresAt).getTime() > now && !clr.revoked) {
            this.localClearances.set(tokenHash, clr);
            return clr;
          }
          return null;
        }
      } catch {
        // Fall back to local cache
      }
    }

    const cached = this.localClearances.get(tokenHash);
    if (!cached) return null;
    if (new Date(cached.expiresAt).getTime() <= now || cached.revoked) {
      this.localClearances.delete(tokenHash);
      this.saveToDisk();
      return null;
    }

    return cached;
  }

  async revokeClearance(identifier: string): Promise<void> {
    let targetHash: string | null = null;
    if (this.localClearances.has(identifier)) {
      targetHash = identifier;
    } else {
      const tokenHash = hashSecret(identifier);
      if (this.localClearances.has(tokenHash)) {
        targetHash = tokenHash;
      } else {
        // Search by clearanceId
        for (const [hash, c] of this.localClearances.entries()) {
          if (c.clearanceId === identifier) {
            targetHash = hash;
            break;
          }
        }
      }
    }

    if (targetHash) {
      const c = this.localClearances.get(targetHash);
      if (c) c.revoked = true;
      this.localClearances.delete(targetHash);
      this.saveToDisk();
    }

    const db = getFirestoreDb();
    if (db && targetHash) {
      try {
        await db.collection("clearances").doc(targetHash).update({ revoked: true });
      } catch {
        // Ignore
      }
    }
  }
}

// ─── 3. DURABLE RATE LIMITER STORE ──────────────────────────────────────────
export class DurableRateLimiterStore {
  private localCounters: Map<string, DurableRateLimitRecord> = new Map();
  private readonly filename = "durable_rate_limits.json";

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const list = readJsonFile<DurableRateLimitRecord[]>(this.filename, []);
    this.localCounters.clear();
    const now = Date.now();
    for (const item of list) {
      if (item.resetAt > now) {
        this.localCounters.set(item.key, item);
      }
    }
  }

  private saveToDisk(): void {
    writeJsonFile(this.filename, Array.from(this.localCounters.values()));
  }

  /**
   * Atomic check and increment for a rate limit key.
   * Works across server restarts and distributed instances via Firestore transactions.
   */
  async checkAndIncrement(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number; count: number; currentCount: number }> {
    const now = Date.now();
    const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, "_");

    const db = getFirestoreDb();
    if (db) {
      try {
        const docRef = db.collection("rate_limits").doc(safeKey);
        const result = await db.runTransaction(async (t) => {
          const snap = await t.get(docRef);
          if (!snap.exists) {
            const newRecord: DurableRateLimitRecord = {
              key: safeKey,
              count: 1,
              resetAt: now + windowMs,
              updatedAt: new Date(now).toISOString(),
            };
            t.set(docRef, newRecord);
            return {
              allowed: true,
              remaining: Math.max(0, limit - 1),
              resetAt: newRecord.resetAt,
              count: 1,
              currentCount: 1,
            };
          }

          const data = snap.data() as DurableRateLimitRecord;
          if (data.resetAt <= now) {
            // Window has expired, start fresh
            const fresh: DurableRateLimitRecord = {
              key: safeKey,
              count: 1,
              resetAt: now + windowMs,
              updatedAt: new Date(now).toISOString(),
            };
            t.set(docRef, fresh);
            return {
              allowed: true,
              remaining: Math.max(0, limit - 1),
              resetAt: fresh.resetAt,
              count: 1,
              currentCount: 1,
            };
          }

          const newCount = (data.count || 0) + 1;
          t.update(docRef, { count: newCount, updatedAt: new Date(now).toISOString() });
          return {
            allowed: newCount <= limit,
            remaining: Math.max(0, limit - newCount),
            resetAt: data.resetAt,
            count: newCount,
            currentCount: newCount,
          };
        });

        // Mirror to local cache for fast reads
        this.localCounters.set(safeKey, {
          key: safeKey,
          count: result.count,
          resetAt: result.resetAt,
          updatedAt: new Date(now).toISOString(),
        });

        return result;
      } catch (err) {
        // Fall through to local durable store if Firestore transaction fails
      }
    }

    // Local durable fallback
    let record = this.localCounters.get(safeKey);
    if (!record || record.resetAt <= now) {
      record = {
        key: safeKey,
        count: 1,
        resetAt: now + windowMs,
        updatedAt: new Date(now).toISOString(),
      };
      this.localCounters.set(safeKey, record);
      this.saveToDisk();
      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetAt: record.resetAt,
        count: 1,
        currentCount: 1,
      };
    }

    record.count += 1;
    record.updatedAt = new Date(now).toISOString();
    this.saveToDisk();

    return {
      allowed: record.count <= limit,
      remaining: Math.max(0, limit - record.count),
      resetAt: record.resetAt,
      count: record.count,
      currentCount: record.count,
    };
  }

  async recordFailedAttempt(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const res = await this.checkAndIncrement(key, 9999, windowMs);
    return { count: res.count, resetAt: res.resetAt };
  }

  async resetLimit(key: string): Promise<void> {
    const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, "_");
    this.localCounters.delete(safeKey);
    this.saveToDisk();

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("rate_limits").doc(safeKey).delete();
      } catch {
        // Ignore
      }
    }
  }
}

// Singletons
export const durableSessionStore = new DurableSessionStore();
export const durableClearanceStore = new DurableClearanceStore();
export const durableRateLimiterStore = new DurableRateLimiterStore();
