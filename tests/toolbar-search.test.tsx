import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolbarSearch } from "../src/components/ui/ToolbarSections";

describe("ToolbarSearch", () => {
  it("has an accessible label independent of its placeholder", () => {
    render(
      <ToolbarSearch
        value=""
        onChange={vi.fn()}
        label="Search medications"
        placeholder="Search by name or instructions"
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Search medications" }),
    ).toHaveAttribute("placeholder", "Search by name or instructions");
  });

  it("exposes a clear action only when a query is present", () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <ToolbarSearch value="aspirin" onChange={vi.fn()} onClear={onClear} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledOnce();

    rerender(<ToolbarSearch value="" onChange={vi.fn()} onClear={onClear} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });
});
