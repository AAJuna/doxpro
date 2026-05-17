import { describe, it, expect } from "vitest";
import {
  can,
  hasFeature,
  isPro,
  canUseFeature,
} from "@/lib/auth/permissions";

describe("permissions matrix", () => {
  describe("can()", () => {
    it("solo has bank.edit and full document control", () => {
      expect(can("solo", "bank.edit")).toBe(true);
      expect(can("solo", "documents.delete.any")).toBe(true);
      expect(can("solo", "settings.company.edit")).toBe(true);
    });

    it("admin has bank.edit and member management", () => {
      expect(can("admin", "bank.edit")).toBe(true);
      expect(can("admin", "members.invite")).toBe(true);
      expect(can("admin", "members.remove")).toBe(true);
      expect(can("admin", "audit.view")).toBe(true);
    });

    it("member CANNOT edit bank or company critical config", () => {
      expect(can("member", "bank.edit")).toBe(false);
      expect(can("member", "settings.company.edit")).toBe(false);
      expect(can("member", "settings.numbering.edit")).toBe(false);
      expect(can("member", "billing.manage")).toBe(false);
    });

    it("member CANNOT manage other members or view audit log", () => {
      expect(can("member", "members.invite")).toBe(false);
      expect(can("member", "members.remove")).toBe(false);
      expect(can("member", "members.role.change")).toBe(false);
      expect(can("member", "audit.view")).toBe(false);
    });

    it("member CAN create + edit own docs, manage clients/products", () => {
      expect(can("member", "documents.create")).toBe(true);
      expect(can("member", "documents.edit.own")).toBe(true);
      expect(can("member", "clients.manage")).toBe(true);
      expect(can("member", "products.manage")).toBe(true);
    });

    it("member CANNOT edit/delete docs created by others", () => {
      expect(can("member", "documents.edit.any")).toBe(false);
      expect(can("member", "documents.delete.any")).toBe(false);
    });

    it("solo lacks team-only permissions (no point inviting yourself)", () => {
      expect(can("solo", "members.invite")).toBe(false);
      expect(can("solo", "audit.view")).toBe(false);
    });
  });

  describe("hasFeature()", () => {
    it("free tier has zero paid features", () => {
      expect(hasFeature("free", "templates.premium")).toBe(false);
      expect(hasFeature("free", "cloud.sync")).toBe(false);
      expect(hasFeature("free", "recurring.invoice")).toBe(false);
      expect(hasFeature("free", "watermark.remove")).toBe(false);
    });

    it("pro_personal unlocks all individual features but NOT team", () => {
      expect(hasFeature("pro_personal", "templates.premium")).toBe(true);
      expect(hasFeature("pro_personal", "cloud.sync")).toBe(true);
      expect(hasFeature("pro_personal", "recurring.invoice")).toBe(true);
      expect(hasFeature("pro_personal", "watermark.remove")).toBe(true);
      expect(hasFeature("pro_personal", "team.mode")).toBe(false);
      expect(hasFeature("pro_personal", "team.audit_log")).toBe(false);
    });

    it("pro_team adds team mode + audit log on top of personal features", () => {
      expect(hasFeature("pro_team", "templates.premium")).toBe(true);
      expect(hasFeature("pro_team", "team.mode")).toBe(true);
      expect(hasFeature("pro_team", "team.audit_log")).toBe(true);
    });

    it("lifetime mirrors pro_personal feature set", () => {
      expect(hasFeature("lifetime", "templates.premium")).toBe(true);
      expect(hasFeature("lifetime", "cloud.sync")).toBe(true);
      expect(hasFeature("lifetime", "team.mode")).toBe(false);
    });
  });

  describe("isPro()", () => {
    it("free is not pro", () => {
      expect(isPro("free")).toBe(false);
    });
    it("all paid tiers are pro", () => {
      expect(isPro("pro_personal")).toBe(true);
      expect(isPro("pro_team")).toBe(true);
      expect(isPro("lifetime")).toBe(true);
    });
  });

  describe("canUseFeature() — combined role+tier gate", () => {
    it("admin on pro_team can invite members AND use team.mode", () => {
      expect(
        canUseFeature("admin", "pro_team", "members.invite", "team.mode"),
      ).toBe(true);
    });

    it("member on pro_team can create documents (tier allows recurring, role allows create)", () => {
      expect(
        canUseFeature("member", "pro_team", "documents.create", "recurring.invoice"),
      ).toBe(true);
    });

    it("admin on free CANNOT use cloud sync (role allows, tier blocks)", () => {
      expect(
        canUseFeature("admin", "free", "settings.company.edit", "cloud.sync"),
      ).toBe(false);
    });

    it("member on pro_team CANNOT use billing (tier allows, role blocks)", () => {
      expect(
        canUseFeature("member", "pro_team", "billing.manage", "templates.premium"),
      ).toBe(false);
    });
  });
});
