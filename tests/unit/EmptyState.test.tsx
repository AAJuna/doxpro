import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="Belum ada data" />);
    expect(screen.getByText("Belum ada data")).toBeInTheDocument();
  });

  it("renders optional description and icon", () => {
    render(
      <EmptyState
        icon={FileText}
        title="Kosong"
        description="Buat dokumen pertama"
      />,
    );
    expect(screen.getByText("Buat dokumen pertama")).toBeInTheDocument();
    // lucide-react renders SVG; verify icon container present via test id by parent class
    const titleEl = screen.getByText("Kosong");
    expect(titleEl.previousElementSibling?.querySelector("svg")).toBeTruthy();
  });

  it("calls action onClick when button clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Kosong"
        action={{ label: "Tambah", onClick, icon: Plus }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /tambah/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when prop omitted", () => {
    render(<EmptyState title="Kosong" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
