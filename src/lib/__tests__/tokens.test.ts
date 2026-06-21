import { describe, it, expect } from "vitest";
import { validateForClaim, validateForSubmit, TOKEN_TTL_MS, SUBMISSION_TTL_MS } from "@/lib/tokens";
import type { TokenForValidation } from "@/lib/tokens";

function makeToken(overrides: Partial<TokenForValidation> = {}): TokenForValidation {
  return {
    claimed: false,
    claimedAt: null,
    used: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── validateForClaim ────────────────────────────────────────────────────────

describe("validateForClaim", () => {
  it("succeeds for a fresh unclaimed token", () => {
    expect(() => validateForClaim(makeToken())).not.toThrow();
  });

  it("throws TOKEN_NOT_FOUND when token is null", () => {
    expect(() => validateForClaim(null)).toThrow("TOKEN_NOT_FOUND");
  });

  it("throws TOKEN_ALREADY_CLAIMED when token has already been claimed", () => {
    const token = makeToken({ claimed: true, claimedAt: new Date() });
    expect(() => validateForClaim(token)).toThrow("TOKEN_ALREADY_CLAIMED");
  });

  it("succeeds when token is exactly TOKEN_TTL_MS old (boundary — still valid)", () => {
    const createdAt = new Date(1000);
    const token = makeToken({ createdAt });
    const now = createdAt.getTime() + TOKEN_TTL_MS; // age === TTL exactly
    expect(() => validateForClaim(token, now)).not.toThrow();
  });

  it("throws TOKEN_EXPIRED when token is 1ms past TOKEN_TTL_MS", () => {
    const createdAt = new Date(1000);
    const token = makeToken({ createdAt });
    const now = createdAt.getTime() + TOKEN_TTL_MS + 1; // 1ms over the line
    expect(() => validateForClaim(token, now)).toThrow("TOKEN_EXPIRED");
  });
});

// ─── validateForSubmit ───────────────────────────────────────────────────────

describe("validateForSubmit", () => {
  it("succeeds for a claimed, unused token within submission window", () => {
    const token = makeToken({ claimed: true, claimedAt: new Date() });
    expect(() => validateForSubmit(token)).not.toThrow();
  });

  it("throws TOKEN_NOT_FOUND when token is null", () => {
    expect(() => validateForSubmit(null)).toThrow("TOKEN_NOT_FOUND");
  });

  it("throws TOKEN_NOT_CLAIMED when token was never claimed", () => {
    const token = makeToken({ claimed: false });
    expect(() => validateForSubmit(token)).toThrow("TOKEN_NOT_CLAIMED");
  });

  it("throws TOKEN_ALREADY_USED when token has been used a second time", () => {
    // Simulates: someone already submitted with this token, then tries again
    const token = makeToken({ claimed: true, claimedAt: new Date(), used: true });
    expect(() => validateForSubmit(token)).toThrow("TOKEN_ALREADY_USED");
  });

  it("succeeds when token is exactly SUBMISSION_TTL_MS old (boundary — still valid)", () => {
    const claimedAt = new Date(1000);
    const token = makeToken({ claimed: true, claimedAt });
    const now = claimedAt.getTime() + SUBMISSION_TTL_MS; // age === TTL exactly
    expect(() => validateForSubmit(token, now)).not.toThrow();
  });

  it("throws TOKEN_EXPIRED when token is 1ms past SUBMISSION_TTL_MS", () => {
    const claimedAt = new Date(1000);
    const token = makeToken({ claimed: true, claimedAt });
    const now = claimedAt.getTime() + SUBMISSION_TTL_MS + 1; // 1ms over the line
    expect(() => validateForSubmit(token, now)).toThrow("TOKEN_EXPIRED");
  });
});
