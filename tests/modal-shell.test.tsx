import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalShell from "../components/ui/ModalShell";

describe("ModalShell", () => {
  it("exposes a titled modal as a labelled dialog without changing its content", () => {
    render(
      <ModalShell isOpen onClose={vi.fn()} title="Lookup records">
        Search content
      </ModalShell>,
    );

    expect(
      screen.getByRole("dialog", { name: "Lookup records" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Search content")).toBeInTheDocument();
  });

  it("labels title-less dialog content through the explicit accessible name", () => {
    render(
      <ModalShell isOpen onClose={vi.fn()} ariaLabel="Confirm deletion">
        Delete confirmation
      </ModalShell>,
    );

    expect(
      screen.getByRole("dialog", { name: "Confirm deletion" }),
    ).toBeInTheDocument();
  });
});
