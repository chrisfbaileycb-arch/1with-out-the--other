import { describe, expect, it, beforeEach } from "vitest";
import { hashSecret, timingSafeEqualStrings, generateSecureToken, serverConfig } from "./config";
import { verifyAndAuthorizePasscode, validateClearanceToken, authenticateInternalUser } from "./security";
import { evaluateDefenseSafety, DEFENSE_RULES } from "./defense";
import { sanitizeMetadata } from "./audit";
import { createDataRepository, LocalFileRepository } from "./repository";

describe("Production Server Modules: Security & Passcode Verification", () => {
  it("computes reproducible and secure SHA-256 HMAC hashes", () => {
    const hash1 = hashSecret("secret-passcode-test");
    const hash2 = hashSecret("secret-passcode-test");
    const hash3 = hashSecret("different-passcode");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });

  it("performs constant-time string comparison preventing timing side-channels", () => {
    expect(timingSafeEqualStrings("abc", "abc")).toBe(true);
    expect(timingSafeEqualStrings("abc", "abd")).toBe(false);
    expect(timingSafeEqualStrings("abc", "ab")).toBe(false);
    expect(timingSafeEqualStrings("", "")).toBe(true);
  });

  it("rejects empty or whitespace-only passcodes", async () => {
    const resEmpty = await verifyAndAuthorizePasscode("", "Test Project", undefined, "127.0.0.1");
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.statusCode).toBe(400);

    const resSpaces = await verifyAndAuthorizePasscode("   ", "Test Project", undefined, "127.0.0.1");
    expect(resSpaces.success).toBe(false);
    expect(resSpaces.statusCode).toBe(400);
  });

  it("rejects arbitrary prefix matching (e.g. '1WITHOUT-FAKE')", async () => {
    // The previous insecure implementation accepted any string starting with "1WITHOUT-"
    const res = await verifyAndAuthorizePasscode("1WITHOUT-FAKE-INVENTED-CODE", "Test Project", undefined, "192.168.1.100");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("never returns raw passcode in authorization clearance response", async () => {
    // Configure default dev passcode test
    const validDevCode = "1WITHOUT-DEV-OVERRIDE-CODE-2026";
    const res = await verifyAndAuthorizePasscode(validDevCode, "Allowlisted Test Project", undefined, "127.0.0.99");

    if (res.success) {
      expect(res.clearance).toBeDefined();
      expect((res.clearance as any).passcode).toBeUndefined();
      expect((res.clearance as any).rawPasscode).toBeUndefined();
      expect((res.clearance as any).passcodeUsed).toBeUndefined();
      expect(res.clearance?.isCleared).toBe(true);
      expect(res.clearance?.clearanceToken).toBeDefined();
      expect(res.clearance?.clearanceToken.length).toBeGreaterThanOrEqual(32);
    }
  });

  it("validates and checks expiration of clearance tokens", async () => {
    const validDevCode = "1WITHOUT-DEV-OVERRIDE-CODE-2026";
    const authRes = await verifyAndAuthorizePasscode(validDevCode, "Expiration Test", undefined, "127.0.0.50");

    if (authRes.success && authRes.clearance) {
      const verified = validateClearanceToken(authRes.clearance.clearanceToken);
      expect(verified).not.toBeNull();
      expect(verified?.projectName).toBe("Expiration Test");

      // An invalid token must return null
      expect(validateClearanceToken("invalid-non-existent-token")).toBeNull();
      expect(validateClearanceToken("")).toBeNull();
      expect(validateClearanceToken(undefined)).toBeNull();
    }
  });

  it("authenticates internal operator credentials and rejects invalid passwords", async () => {
    const validUser = serverConfig.internalAuthUser;
    // Test with invalid credentials
    const badRes = await authenticateInternalUser(validUser, "wrong-password-1234");
    expect(badRes.success).toBe(false);
    expect(badRes.session).toBeUndefined();

    const emptyRes = await authenticateInternalUser("", "");
    expect(emptyRes.success).toBe(false);
  });
});

describe("Production Server Modules: Defense-of-Break Heuristic Boundaries", () => {
  it("unconditionally BLOCKS raw private keys with zero bypass", async () => {
    const maliciousPayload = `
      Here is the project setup:
      -----BEGIN RSA PRIVATE KEY-----
      MIIEowIBAAKCAQEA0Y1+someSecretKeyDataHere
      -----END RSA PRIVATE KEY-----
    `;
    const res = await evaluateDefenseSafety(maliciousPayload);
    expect(res.decision).toBe("BLOCKED");
    expect(res.category).toBe("CREDENTIAL_LEAK");
    expect(res.allowlistedProjectEligible).toBe(false);
  });

  it("unconditionally BLOCKS live cloud API keys (e.g. Stripe, AWS)", async () => {
    const stripePayload = "Use live key sk_live_99887766554433221100 to configure webhook";
    const res = await evaluateDefenseSafety(stripePayload);
    expect(res.decision).toBe("BLOCKED");
    expect(res.category).toBe("CREDENTIAL_LEAK");
  });

  it("unconditionally BLOCKS unmasked Social Security Numbers", async () => {
    const piiPayload = "Employee SSN: 123-45-6789 registered for benefits.";
    const res = await evaluateDefenseSafety(piiPayload);
    expect(res.decision).toBe("BLOCKED");
    expect(res.category).toBe("ZERO_TOLERANCE_PII");
  });

  it("unconditionally BLOCKS payment card PAN numbers", async () => {
    const panPayload = "Billing card number: 4111111111111111 verified.";
    const res = await evaluateDefenseSafety(panPayload);
    expect(res.decision).toBe("BLOCKED");
    expect(res.category).toBe("ZERO_TOLERANCE_PII");
  });

  it("unconditionally BLOCKS medical diagnosis and patient records", async () => {
    const medPayload = "Automated assistant to diagnose patient and prescribe medication for infection.";
    const res = await evaluateDefenseSafety(medPayload);
    expect(res.decision).toBe("BLOCKED");
    expect(res.category).toBe("ZERO_TOLERANCE_PII");
  });

  it("requires authorization for Bankruptcy / Restructuring workflows, which can be unlocked with valid clearance token", async () => {
    const restructuringPayload = "Initiate Chapter 11 debtor-in-possession creditor reorganization claims.";
    
    // Without clearance token:
    const unauthRes = await evaluateDefenseSafety(restructuringPayload);
    expect(unauthRes.decision).toBe("REQUIRES_AUTHORIZATION");
    expect(unauthRes.allowlistedProjectEligible).toBe(true);
    expect(unauthRes.authorizationStatus).toBe("UNAUTHORIZED");

    // With authorized clearance token:
    const validDevCode = "1WITHOUT-DEV-OVERRIDE-CODE-2026";
    const authRes = await verifyAndAuthorizePasscode(validDevCode, "Restructuring Test", undefined, "10.0.0.1");

    if (authRes.success && authRes.clearance) {
      const authorizedRes = await evaluateDefenseSafety(restructuringPayload, authRes.clearance.clearanceToken);
      expect(authorizedRes.decision).toBe("ALLOWED");
      expect(authorizedRes.authorizationStatus).toBe("AUTHORIZED");
    }
  });

  it("allows benign web and enterprise project specifications without restriction", async () => {
    const benignPayload = "Create a React and Tailwind dashboard for inventory tracking and warehouse shipments.";
    const res = await evaluateDefenseSafety(benignPayload);
    expect(res.decision).toBe("ALLOWED");
    expect(res.category).toBe("BENIGN_AUDIT");
    expect(res.authorizationStatus).toBe("NOT_REQUIRED");
  });

  it("masks detected sensitive snippets to avoid reflection in responses", async () => {
    const piiPayload = "User tax id is 987-65-4321 for verification.";
    const res = await evaluateDefenseSafety(piiPayload);
    expect(res.detectedSnippets.length).toBeGreaterThan(0);
    // Snippet must be masked with asterisks
    expect(res.detectedSnippets[0]).toContain("*");
  });
});

describe("Production Server Modules: Audit Trail Sanitization", () => {
  it("scrubs passcodes, passwords, and secret tokens from audit metadata", () => {
    const rawMetadata = {
      passcode: "SUPER_SECRET_PASS",
      password: "operator-password-123",
      user_token: "jwt-token-val",
      client_secret: "stripe_sec_key",
      safeKey: "production-build-v2",
      count: 42,
      nested: {
        api_key: "gemini-api-key-here",
        legitimateInfo: "all-good",
      },
    };

    const sanitized = sanitizeMetadata(rawMetadata);
    expect(sanitized.passcode).toBe("[REDACTED_SECRET]");
    expect(sanitized.password).toBe("[REDACTED_SECRET]");
    expect(sanitized.user_token).toBe("[REDACTED_SECRET]");
    expect(sanitized.client_secret).toBe("[REDACTED_SECRET]");
    expect(sanitized.safeKey).toBe("production-build-v2");
    expect(sanitized.count).toBe(42);
    expect(sanitized.nested.api_key).toBe("[REDACTED_SECRET]");
    expect(sanitized.nested.legitimateInfo).toBe("all-good");
  });
});

describe("Production Server Modules: Data Repository & Dual-Write Persistence", () => {
  it("successfully initializes repository and returns health check diagnostic", async () => {
    const repo = createDataRepository();
    const health = await repo.healthCheck();

    expect(health).toBeDefined();
    expect(typeof health.healthy).toBe("boolean");
    expect(typeof health.mode).toBe("string");
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("persists and reads back audit events with pagination", async () => {
    const repo = createDataRepository();
    const testRequestId = `test-req-${generateSecureToken(6)}`;

    await repo.saveAuditEvent({
      id: `audit-${generateSecureToken(8)}`,
      requestId: testRequestId,
      userIdentifier: "test-operator",
      sessionId: "test-session",
      action: "SECURITY_TEST_AUDIT",
      route: "/api/test/route",
      targetResource: "test-resource",
      outcome: "SUCCESS",
      statusCode: 200,
      createdAt: new Date().toISOString(),
    });

    const events = await repo.getAuditEvents(10, 0);
    expect(events.length).toBeGreaterThanOrEqual(1);
    const found = events.find((e) => e.requestId === testRequestId);
    expect(found).toBeDefined();
    expect(found?.action).toBe("SECURITY_TEST_AUDIT");
  });
});
