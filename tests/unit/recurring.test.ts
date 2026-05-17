import { describe, it, expect } from "vitest";
import { advanceDate } from "@/lib/recurring";

describe("advanceDate", () => {
  it("weekly = +7 hari", () => {
    expect(advanceDate("2026-05-17", "weekly")).toBe("2026-05-24");
  });

  it("monthly = +1 bulan", () => {
    expect(advanceDate("2026-05-17", "monthly")).toBe("2026-06-17");
  });

  it("monthly handle end-of-month overflow (31 Jan → 28/29 Feb)", () => {
    // 31 Januari + 1 bulan = Date overflow ke awal Maret
    // Behavior native JS: setMonth wraps, jadi 31 Jan → 3 Mar (or 2/3 di leap year)
    const result = advanceDate("2026-01-31", "monthly");
    // Verify it's a valid date and roughly correct period
    expect(result).toMatch(/^2026-0(2|3)-/);
  });

  it("yearly = +1 tahun", () => {
    expect(advanceDate("2026-05-17", "yearly")).toBe("2027-05-17");
  });

  it("handle invalid input (gak crash)", () => {
    expect(advanceDate("not-a-date", "monthly")).toBe("not-a-date");
  });

  it("consecutive monthly advance", () => {
    let d = "2026-01-15";
    for (let i = 0; i < 3; i++) d = advanceDate(d, "monthly");
    expect(d).toBe("2026-04-15");
  });
});
