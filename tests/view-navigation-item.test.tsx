import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Icons } from "../src/components/ui/Icons";
import ViewNavigationItem from "../src/components/ui/ViewNavigationItem";
import BottomActionBar from "../src/components/ui/BottomActionBar";
import ResponsiveTableSurface from "../src/components/ui/ResponsiveTableSurface";

describe("ViewNavigationItem", () => {
  it("exposes the active view as the current page", () => {
    render(
      <ViewNavigationItem
        icon={Icons.Home}
        label="Dashboard"
        active
        layout="bottom"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps collapsed sidebar destinations labelled and operable", () => {
    const onClick = vi.fn();
    render(
      <ViewNavigationItem
        icon={Icons.ClipboardList}
        label="Clinical Orders"
        active={false}
        layout="sidebar"
        collapsed
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clinical Orders" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("presents selection actions as a named nonmodal group", () => {
    render(
      <BottomActionBar isVisible label="Actions for selected records">
        <button>Delete</button>
      </BottomActionBar>,
    );

    expect(
      screen.getByRole("group", { name: "Actions for selected records" }),
    ).toContainElement(screen.getByRole("button", { name: "Delete" }));
  });

  it("labels the responsive record surface without claiming grid semantics", () => {
    render(
      <ResponsiveTableSurface label="Medications">
        <p>Medication rows</p>
      </ResponsiveTableSurface>,
    );

    expect(
      screen.getByRole("region", { name: "Medications" }),
    ).toHaveTextContent("Medication rows");
    expect(screen.queryByRole("grid")).toBeNull();
  });
});
