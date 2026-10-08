import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ClinicalMarkdown from "../components/ui/ClinicalMarkdown";

describe("ClinicalMarkdown", () => {
  it("preserves custom paragraph, heading, and list rendering", () => {
    const { container } = render(
      <ClinicalMarkdown
        content={"## Assessment\n\nClinical summary\n\n- First finding"}
        className="custom-prose"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Assessment" }),
    ).toHaveClass("text-sm", "font-bold");
    expect(screen.getByText("Clinical summary").tagName).toBe("P");
    expect(container.querySelector("ul")).toHaveClass("list-disc", "pl-5");
    expect(container.firstElementChild).toHaveClass("custom-prose");
  });
});
