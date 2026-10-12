import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ClinicalAssistance from "../src/features/chart/components/ClinicalAssistance";

describe("ClinicalAssistance", () => {
  it("keeps existing recommendations and shows safe feedback after generation fails", async () => {
    render(
      <ClinicalAssistance
        content={["Continue monitoring symptoms."]}
        sectionTitle="Objective"
        onGenerateMore={async () => {
          throw new Error("provider configuration details");
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Clinical Assistance/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /More Recommendations/ }),
    );

    expect(
      await screen.findByText(
        "Could not load more recommendations. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Continue monitoring symptoms."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("provider configuration details"),
    ).not.toBeInTheDocument();
  });
});
