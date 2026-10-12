import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Toast from "../src/components/Toast";

describe("Toast", () => {
  it("announces errors as alerts", () => {
    render(<Toast message="Unable to save" onClose={vi.fn()} type="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-atomic", "true");
  });

  it("announces successful feedback as a polite status", () => {
    render(<Toast message="Changes saved" onClose={vi.fn()} type="success" />);

    expect(screen.getByRole("status")).toHaveTextContent("Changes saved");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
