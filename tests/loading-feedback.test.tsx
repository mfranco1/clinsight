import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LoadingIndicator,
  LoadingScreen,
  Skeleton,
  ErrorState,
} from "../src/components/ui/LoadingFeedback";
import EmptyState from "../src/components/ui/EmptyState";
import { Icons } from "../src/components/ui/Icons";

describe("loading feedback primitives", () => {
  it("announces the operation through a polite status", () => {
    render(<LoadingIndicator label="Loading patient chart…" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading patient chart…",
    );
    expect(screen.getByRole("status").firstElementChild).toHaveClass(
      "motion-reduce:animate-none",
    );
  });

  it("pairs the app logo and an accessible startup loading message with a bar", () => {
    render(<LoadingScreen />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading Clinsight…");
    expect(document.querySelector(".loading-bar")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("keeps decorative skeleton shapes out of the accessibility tree", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("skeleton-shimmer");
  });

  it("offers a compact error composition with an action", () => {
    render(
      <ErrorState
        variant="inline"
        title="Could not save"
        message="Your draft is still available."
        action={<button>Retry</button>}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Your draft is still available.");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("supports concise dismissible inline errors without inventing a title", () => {
    render(
      <ErrorState
        variant="inline"
        message="Microphone access is unavailable."
        inlineAction={<button>Dismiss</button>}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Microphone access is unavailable.");
    expect(alert.querySelector("h2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("supports compact empty-state composition with a workflow action", () => {
    render(
      <EmptyState
        icon={Icons.Search}
        title="No results"
        description="Try a different search."
        variant="compact"
        action={{ label: "Clear search", onClick: () => undefined }}
      />,
    );

    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("allows feature-owned action groups in the shared empty state", () => {
    render(
      <EmptyState
        icon={Icons.ClipboardList}
        title="No orders found"
        description="Start by adding your first order"
        footer={
          <div>
            <button type="button">Bulk Add</button>
            <button type="button">Add Order</button>
          </div>
        }
      />,
    );

    expect(
      screen.getByRole("button", { name: "Bulk Add" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Order" }),
    ).toBeInTheDocument();
  });
});
