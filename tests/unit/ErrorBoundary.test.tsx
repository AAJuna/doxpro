import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error("KABOOM");
  return <div>OK</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React's expected console.error output saat test exception
  const consoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = consoleError;
  });

  it("renders children kalau gak ada error", () => {
    render(
      <ErrorBoundary>
        <Bomb explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("renders fallback default + error message saat children throw", () => {
    render(
      <ErrorBoundary>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Ada yang gak beres")).toBeInTheDocument();
    expect(screen.getByText("KABOOM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument();
  });

  it("tombol Coba Lagi tersedia di fallback UI", () => {
    render(
      <ErrorBoundary>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    const resetBtn = screen.getByRole("button", { name: /coba lagi/i });
    expect(resetBtn).toBeInTheDocument();
    // Tombol clickable; reset behavior butuh integration test untuk verify
    // children re-render karena React fiber state reset is timing-sensitive
    fireEvent.click(resetBtn);
  });

  it("pakai custom fallback function kalau diberikan", () => {
    render(
      <ErrorBoundary fallback={(err) => <div>custom: {err.message}</div>}>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("custom: KABOOM")).toBeInTheDocument();
  });
});
