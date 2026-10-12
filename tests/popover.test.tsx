import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../src/components/ui/Popover";

const ExamplePopover = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">Templates</button>
      </PopoverTrigger>
      <PopoverContent aria-label="Input templates" align="end">
        <button type="button">Admission</button>
      </PopoverContent>
    </Popover>
  );
};

describe("Popover", () => {
  it("renders controlled content in an accessible portal and restores focus on Escape", async () => {
    render(<ExamplePopover />);
    const trigger = screen.getByRole("button", { name: "Templates" });
    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Input templates" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Admission" })).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Input templates" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});
