import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PlanSection from "../src/features/chart/components/PlanSection";
import { ToastProvider } from "../src/components/ui/ToastProvider";
import type { GeneralData, PlanItem } from "../src/types";

const generalData: GeneralData = {
  patientName: "Synthetic Patient",
  ageSex: "",
  mrn: "",
  dob: "",
  admissionDate: "",
  address: "",
  religion: "",
  handedness: "",
};

describe("PlanSection delete confirmation", () => {
  it("requires an explicit choice and removes only the confirmed plan item", () => {
    const planData: PlanItem[] = [
      { problem: "Problem A", diagnostics: ["Test A"] },
      { problem: "Problem B", therapeutics: ["Treatment B"] },
    ];
    const onUpdate = vi.fn();
    render(
      <ToastProvider>
        <PlanSection
          planData={planData}
          generalData={generalData}
          onUpdate={onUpdate}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getAllByTitle("Delete Problem")[0]);
    expect(
      screen.getByRole("dialog", { name: "Delete Plan Item?" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(
      screen.getByRole("dialog", { name: "Delete Plan Item?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("dialog", { name: "Delete Plan Item?" }),
    ).toBeNull();
    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByTitle("Delete Problem")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith([planData[0]]);
  });
});
