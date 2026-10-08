import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLazyFeature } from "../src/components/ui/LazyFeature";

describe("lazy feature boundary", () => {
  it("shows loading feedback and retries a failed feature import", async () => {
    let attempts = 0;
    const Feature = createLazyFeature<{ label: string }>(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("synthetic chunk failure");
      return { default: ({ label }) => <h1>{label}</h1> };
    });

    render(<Feature label="Clinical feature" />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This view could not be loaded.",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Clinical feature" }),
    ).toBeVisible();
    expect(attempts).toBe(2);
  });
});
