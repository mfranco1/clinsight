import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LoadingIndicator,
  LoadingScreen,
  Skeleton,
} from "../src/components/ui/LoadingFeedback";

describe("loading feedback primitives", () => {
  it("announces the operation through a polite status", () => {
    render(<LoadingIndicator label="Loading patient chart…" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading patient chart…",
    );
  });

  it("pairs the app logo with an accessible startup loading message", () => {
    render(<LoadingScreen label="Loading ClinSight…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading ClinSight…");
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("keeps decorative skeleton shapes out of the accessibility tree", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("skeleton-shimmer");
  });
});
