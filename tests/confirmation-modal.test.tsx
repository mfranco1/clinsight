import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmationModal from "../src/components/dialogs/ConfirmationModal";

describe("ConfirmationModal", () => {
  it("calls confirm once and closes synchronously after confirmation", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete note?"
        message="This action cannot be undone."
        confirmLabel="Delete"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0],
    );
  });

  it("does not invoke confirmation or close when confirmation is disabled", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete note?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        isConfirmDisabled
      />,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("allows workflows to disable Escape and backdrop dismissal", () => {
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Clear current data?"
        message="The existing workflow requires an explicit choice."
        confirmLabel="Clear"
        closeOnInteractOutside={false}
        closeOnEscape={false}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});
