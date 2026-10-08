import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryView, {
  formatSummaryForClipboard,
} from "../src/features/handoff/SummaryView";

describe("handoff summary presentation", () => {
  it("omits legacy clinical pearls from copied summaries", () => {
    const copied = formatSummaryForClipboard({
      patientId: "patient-1",
      oneLiner: "Stable",
      activeIssues: [],
      toDoList: [],
      clinicalPearl: "Legacy education",
    });

    expect(copied).toContain("SUMMARY:\nStable");
    expect(copied).not.toContain("Clinical Pearl");
    expect(copied).not.toContain("Legacy education");
  });

  it("does not render a saved legacy clinical pearl", () => {
    render(
      <SummaryView
        data={{
          patientId: "patient-1",
          oneLiner: "Stable",
          activeIssues: [],
          toDoList: [],
          clinicalPearl: "Legacy education",
        }}
      />,
    );

    expect(screen.queryByText("Legacy education")).not.toBeInTheDocument();
    expect(screen.queryByText("Clinical Pearl")).not.toBeInTheDocument();
  });
});
