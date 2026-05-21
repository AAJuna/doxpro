import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { needsReSync, isWithinGracePeriod } from "@/lib/auth/license";
import type { LocalUser } from "@/types";

const baseUser = (overrides: Partial<LocalUser> = {}): LocalUser => ({
  id: "u1",
  email: "x@y.com",
  role: "solo",
  tier: "pro_personal",
  createdAt: "2026-01-01T00:00:00Z",
  lastVerifiedAt: "2026-05-18T00:00:00Z",
  ...overrides,
});

describe("license sync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("needsReSync", () => {
    it("returns false if verified less than 24h ago", () => {
      const u = baseUser({ lastVerifiedAt: "2026-05-18T00:00:00Z" });
      expect(needsReSync(u)).toBe(false);
    });

    it("returns true if verified more than 24h ago", () => {
      const u = baseUser({ lastVerifiedAt: "2026-05-16T00:00:00Z" });
      expect(needsReSync(u)).toBe(true);
    });

    it("returns true if never verified", () => {
      const u = baseUser({ lastVerifiedAt: undefined });
      expect(needsReSync(u)).toBe(true);
    });

    it("returns false for free tier (nothing to sync)", () => {
      const u = baseUser({ tier: "free", lastVerifiedAt: undefined });
      expect(needsReSync(u)).toBe(false);
    });
  });

  describe("isWithinGracePeriod", () => {
    it("true if last verified within 30 days", () => {
      const u = baseUser({ lastVerifiedAt: "2026-04-20T00:00:00Z" });
      expect(isWithinGracePeriod(u)).toBe(true);
    });

    it("false if last verified more than 30 days ago", () => {
      const u = baseUser({ lastVerifiedAt: "2026-04-15T00:00:00Z" });
      expect(isWithinGracePeriod(u)).toBe(false);
    });

    it("true for free tier regardless", () => {
      const u = baseUser({ tier: "free", lastVerifiedAt: "2020-01-01T00:00:00Z" });
      expect(isWithinGracePeriod(u)).toBe(true);
    });

    it("true for lifetime even if never re-verified", () => {
      const u = baseUser({ tier: "lifetime", lastVerifiedAt: "2020-01-01T00:00:00Z" });
      expect(isWithinGracePeriod(u)).toBe(true);
    });
  });
});
