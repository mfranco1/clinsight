import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createLazyFeature } from "../src/components/ui/LazyFeature";

describe("lazy feature boundary", () => {
  it("shows loading feedback and retries a failed feature import", async () => {
    let attempts = 0;
    const Feature = createLazyFeature<{ label: string }>(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("synthetic chunk failure");
      return { default: ({ label }) => <h1>{label}</h1> };
    });

    const firstMount = render(<Feature label="Clinical feature" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading view…");
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

    firstMount.unmount();
    render(<Feature label="Clinical feature" />);
    expect(
      screen.getByRole("heading", { name: "Clinical feature" }),
    ).toBeVisible();
    expect(attempts).toBe(2);
  });

  it("reuses a successfully loaded module after the view remounts", async () => {
    let attempts = 0;
    const Feature = createLazyFeature<{ label: string }>(async () => {
      attempts += 1;
      return { default: ({ label }) => <h1>{label}</h1> };
    });

    const firstMount = render(<Feature label="Orders" />);
    expect(
      await screen.findByRole("heading", { name: "Orders" }),
    ).toBeVisible();
    firstMount.unmount();

    render(<Feature label="Orders" />);

    expect(screen.getByRole("heading", { name: "Orders" })).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(attempts).toBe(1);
  });
});
