import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SidePanelShell from "../src/components/ui/SidePanelShell";

describe("SidePanelShell", () => {
  it("provides a nonmodal labelled panel with explicit close behavior", () => {
    const onClose = vi.fn();

    render(
      <SidePanelShell isOpen onClose={onClose} title="Suggestions">
        <button type="button">Retry</button>
      </SidePanelShell>,
    );

    const panel = screen.getByRole("dialog", { name: "Suggestions" });
    expect(panel).toHaveAttribute("aria-modal", "false");
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();

    fireEvent.keyDown(panel, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText("Close Suggestions"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("supports a left-side drawer for navigation history panels", () => {
    render(
      <SidePanelShell
        isOpen
        onClose={vi.fn()}
        title="Chart History"
        side="left"
      >
        History entries
      </SidePanelShell>,
    );

    expect(screen.getByRole("dialog", { name: "Chart History" })).toHaveClass(
      "left-0",
      "right-auto",
      "border-r",
      "data-[state=closed]:-translate-x-full",
    );
  });

  it("unmounts closed panel content by default", () => {
    const { rerender } = render(
      <SidePanelShell isOpen onClose={vi.fn()} title="Suggestions">
        <button type="button">Retry</button>
      </SidePanelShell>,
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    rerender(
      <SidePanelShell isOpen={false} onClose={vi.fn()} title="Suggestions">
        <button type="button">Retry</button>
      </SidePanelShell>,
    );

    expect(screen.queryByRole("dialog", { name: "Suggestions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("keeps opt-in retained content inert and hidden while closed", () => {
    const { rerender } = render(
      <SidePanelShell isOpen keepMounted onClose={vi.fn()} title="Assistant">
        <button type="button">Send message</button>
      </SidePanelShell>,
    );

    rerender(
      <SidePanelShell
        isOpen={false}
        keepMounted
        onClose={vi.fn()}
        title="Assistant"
      >
        <button type="button">Send message</button>
      </SidePanelShell>,
    );

    const closedPanel = document.querySelector('[role="dialog"]');
    expect(closedPanel).toHaveAttribute("aria-hidden", "true");
    expect(closedPanel).toHaveAttribute("inert");
    expect(closedPanel?.querySelector("button")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
  });
});
