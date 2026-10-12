import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../src/app/shell/Sidebar";
import { ViewMode } from "../src/types";

describe("Sidebar navigation", () => {
  it("exposes a keyboard-operable collapse control for the primary navigation", () => {
    render(
      <Sidebar
        currentView={ViewMode.DASHBOARD}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
        showMobileNav
      />,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const collapseButton = screen.getByRole("button", {
      name: "Collapse sidebar",
    });

    expect(collapseButton).toHaveAttribute(
      "aria-controls",
      "primary-navigation",
    );
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(collapseButton);

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(primaryNavigation).toBeInTheDocument();
  });

  it("labels desktop and mobile navigation landmarks separately", () => {
    render(
      <Sidebar
        currentView={ViewMode.DASHBOARD}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
        showMobileNav
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Mobile primary navigation" }),
    ).toBeInTheDocument();
  });

  it("marks Settings as the current page in both navigation layouts", () => {
    render(
      <Sidebar
        currentView={ViewMode.SETTINGS}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
        showMobileNav
      />,
    );

    const settingsButtons = screen.getAllByRole("button", { name: "Settings" });
    expect(settingsButtons).toHaveLength(2);
    settingsButtons.forEach((button) =>
      expect(button).toHaveAttribute("aria-current", "page"),
    );
  });
});
