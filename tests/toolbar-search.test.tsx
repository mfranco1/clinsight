import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ToolbarFilterToggle,
  ToolbarSearch,
} from "../src/components/ui/ToolbarSections";
import { SearchField } from "../src/components/ui/SearchField";

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

  it("keeps pending and disabled presentation accessible without owning search behavior", () => {
    const onChange = vi.fn();
    render(
      <SearchField
        value="patient"
        onChange={onChange}
        label="Search patients"
        pending
        disabled
        onClear={vi.fn()}
      />,
    );

    const field = screen.getByRole("textbox", { name: "Search patients" });
    expect(field).toBeDisabled();
    expect(field).toHaveAttribute("aria-busy", "true");
    expect(
      screen.queryByRole("button", { name: "Clear search patients" }),
    ).toBeNull();
  });
});

describe("ToolbarFilterToggle", () => {
  it("has a fallback accessible name when its visible label is hidden on mobile", () => {
    render(
      <ToolbarFilterToggle
        isExpanded={false}
        onClick={vi.fn()}
        hideLabelOnMobile
      />,
    );

    expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("supports a contextual accessible name and expanded filter region", () => {
    render(
      <>
        <ToolbarFilterToggle
          isExpanded
          onClick={vi.fn()}
          ariaLabel="Filter chart history"
          controlsId="chart-history-filters"
        />
        <div id="chart-history-filters">History filters</div>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Filter chart history" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Filter chart history" }),
    ).toHaveAttribute("aria-controls", "chart-history-filters");
  });
});
