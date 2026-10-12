import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalShell from "../src/components/ui/ModalShell";

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

  it("closes on Escape through the accessible dialog primitive", () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen onClose={onClose} title="Keyboard dialog">
        Dialog content
      </ModalShell>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("associates a description with the dialog", () => {
    render(
      <ModalShell
        isOpen
        onClose={vi.fn()}
        title="Review changes"
        description="Check the changes before applying them."
      >
        Dialog content
      </ModalShell>,
    );

    expect(
      screen.getByRole("dialog", { name: "Review changes" }),
    ).toHaveAccessibleDescription("Check the changes before applying them.");
  });

  it("can keep the dialog open on Escape and outside interaction", () => {
    const onClose = vi.fn();
    render(
      <ModalShell
        isOpen
        onClose={onClose}
        title="Preserve entered order"
        closeOnEscape={false}
        closeOnInteractOutside={false}
      >
        Dialog content
      </ModalShell>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("supports a safe-area-aware bottom sheet placement", () => {
    render(
      <ModalShell
        isOpen
        onClose={vi.fn()}
        title="Bulk orders"
        placement="bottom"
        size="3xl"
      >
        Order entry
      </ModalShell>,
    );

    expect(screen.getByRole("dialog", { name: "Bulk orders" })).toHaveClass(
      "bottom-0",
      "max-w-full",
      "pb-[env(safe-area-inset-bottom)]",
      "sm:max-w-3xl",
    );
  });
});
