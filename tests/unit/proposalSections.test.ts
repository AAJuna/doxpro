import { describe, it, expect } from "vitest";
import { parseProposalSections } from "@/components/pdf-templates/proposalSections";

describe("parseProposalSections", () => {
  it("empty input returns empty array", () => {
    expect(parseProposalSections("")).toEqual([]);
    expect(parseProposalSections(undefined)).toEqual([]);
    expect(parseProposalSections(null)).toEqual([]);
    expect(parseProposalSections("   \n  \n")).toEqual([]);
  });

  it("plain text without headings returns single section with null heading", () => {
    const out = parseProposalSections("Just one paragraph.\nLine two.");
    expect(out).toEqual([{ heading: null, body: "Just one paragraph.\nLine two." }]);
  });

  it("splits on # headings", () => {
    const out = parseProposalSections(`# Ringkasan\nIsi ringkasan\n\n# Lingkup\nDetail lingkup`);
    expect(out).toEqual([
      { heading: "Ringkasan", body: "Isi ringkasan" },
      { heading: "Lingkup", body: "Detail lingkup" },
    ]);
  });

  it("supports ##, ### levels (treated as heading)", () => {
    const out = parseProposalSections(`## Sub\nbody\n### Deep\nmore`);
    expect(out.map((s) => s.heading)).toEqual(["Sub", "Deep"]);
  });

  it("preamble before first heading kept as headless section", () => {
    const out = parseProposalSections(`Intro line\n\n# First\ncontent`);
    expect(out).toEqual([
      { heading: null, body: "Intro line" },
      { heading: "First", body: "content" },
    ]);
  });

  it("heading without body still emits", () => {
    const out = parseProposalSections(`# Solo\n\n# Next\nbody`);
    expect(out).toEqual([
      { heading: "Solo", body: "" },
      { heading: "Next", body: "body" },
    ]);
  });

  it("normalizes CRLF", () => {
    const out = parseProposalSections("# A\r\nbody\r\n# B\r\nx");
    expect(out).toEqual([
      { heading: "A", body: "body" },
      { heading: "B", body: "x" },
    ]);
  });
});
