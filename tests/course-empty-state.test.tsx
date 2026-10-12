import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CourseView from "../src/features/course/CourseView";

describe("CourseView empty results", () => {
  it("uses the shared compact empty state for an empty filtered timeline", () => {
    render(<CourseView events={[]} />);

    expect(
      screen.getByRole("heading", { name: "No clinical events found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No clinical events match your current filter criteria.",
      ),
    ).toBeInTheDocument();
  });
});
