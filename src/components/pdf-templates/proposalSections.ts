export interface ProposalSection {
  heading: string | null;
  body: string;
}

const HEADING_RE = /^(#{1,3})\s+(.+)$/;

export function parseProposalSections(text: string | undefined | null): ProposalSection[] {
  if (!text || !text.trim()) return [];

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: ProposalSection[] = [];
  let current: ProposalSection = { heading: null, body: "" };

  const push = () => {
    const body = current.body.replace(/\s+$/, "");
    if (current.heading || body.trim()) {
      sections.push({ heading: current.heading, body });
    }
  };

  for (const line of lines) {
    const m = HEADING_RE.exec(line);
    if (m) {
      push();
      current = { heading: m[2].trim(), body: "" };
    } else {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  push();

  return sections;
}
