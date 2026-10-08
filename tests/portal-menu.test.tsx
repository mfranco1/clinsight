import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PortalMenu from "../components/ui/PortalMenu";

describe("PortalMenu", () => {
  it("renders its anchored content and keeps backdrop dismissal", () => {
    const onClose = vi.fn();
    render(
      <PortalMenu
        isOpen
        isDesktop
        position={{ top: 40, left: 20, width: 80 }}
        onClose={onClose}
      >
        Menu content
      </PortalMenu>,
    );

    expect(screen.getByText("Menu content")).toBeInTheDocument();
    const backdrop = document.body.querySelector(".fixed.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
