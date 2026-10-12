import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PatientHeader from "../src/app/shell/PatientHeader";
import { structuredPatientCase } from "./fixtures/patient-cases";
import { ViewMode } from "../src/types";

describe("PatientHeader navigation", () => {
  it("labels patient sections and marks the selected view as the current page", () => {
    const onNavigate = vi.fn();
    render(
      <PatientHeader
        patientInfo={structuredPatientCase.patientInfo}
        activeEncounter={structuredPatientCase.encounters[0]}
        currentView={ViewMode.CHART}
        onNavigate={onNavigate}
        onBack={vi.fn()}
      />,
    );

    const sections = screen.getByRole("navigation", {
      name: "Patient sections",
    });
    expect(sections).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Chart", current: "page" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Orders" })).not.toHaveAttribute(
      "aria-current",
    );

    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    expect(onNavigate).toHaveBeenCalledWith(ViewMode.ORDERS);
  });
});
