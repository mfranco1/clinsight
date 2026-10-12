import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MedicationOrderRow from "../src/features/orders/components/MedicationOrderRow";
import PatientOrderCard from "../src/features/orders/components/PatientOrderCard";
import { MedicationStatus, OrderStatus } from "../src/types";

describe("order row selection controls", () => {
  it("associates medication editor labels and preserves values on save", () => {
    const medication = {
      id: "med-edit-1",
      drug: "Amoxicillin",
      dose: "500 mg",
      route: "PO",
      frequency: "BID",
      duration: "7 days",
      status: MedicationStatus.ACTIVE,
      prescribedDate: "2026-10-12",
      prescribedBy: "Dr. Example",
      notes: "Take with food",
    };
    const onUpdate = vi.fn();
    render(
      <MedicationOrderRow
        med={medication}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit medication Amoxicillin" }),
    );

    expect(
      screen.getByRole("textbox", { name: "Medication Name" }),
    ).toHaveValue("Amoxicillin");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue(
      MedicationStatus.ACTIVE,
    );
    expect(screen.getByRole("textbox", { name: "Dose" })).toHaveValue("500 mg");
    expect(screen.getByRole("textbox", { name: "Route" })).toHaveValue("PO");
    expect(screen.getByRole("textbox", { name: "Frequency" })).toHaveValue(
      "BID",
    );
    expect(screen.getByRole("textbox", { name: "Duration" })).toHaveValue(
      "7 days",
    );
    expect(
      screen.getByRole("textbox", { name: "Medication notes" }),
    ).toHaveValue("Take with food");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onUpdate).toHaveBeenCalledWith(medication);
  });

  it("labels medication selection and exposes its pressed state", () => {
    render(
      <MedicationOrderRow
        med={{
          id: "med-1",
          drug: "Amoxicillin",
          dose: "500 mg",
          route: "PO",
          frequency: "BID",
          duration: "7 days",
          status: MedicationStatus.ACTIVE,
          prescribedDate: "2026-10-12",
          prescribedBy: "Dr. Example",
        }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isSelectMode
        isSelected
        onToggleSelect={vi.fn()}
      />,
    );

    const controls = screen.getAllByRole("button", {
      name: "Deselect medication Amoxicillin",
    });
    expect(controls).toHaveLength(2);
    controls.forEach((control) =>
      expect(control).toHaveAttribute("aria-pressed", "true"),
    );
    expect(
      screen.getByRole("button", { name: "Edit medication Amoxicillin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete medication Amoxicillin" }),
    ).toBeInTheDocument();
  });

  it("labels diagnostic selection controls with the order name", () => {
    render(
      <PatientOrderCard
        order={{
          id: "order-1",
          name: "Complete blood count",
          dateOrdered: "2026-10-12T08:00:00.000Z",
          targetDate: "2026-10-12T09:00:00.000Z",
          status: OrderStatus.PENDING,
          notes: "",
          category: "Lab",
        }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isSelectMode
        onToggleSelect={vi.fn()}
        isOverlay
      />,
    );

    const controls = screen.getAllByRole("button", {
      name: "Select order Complete blood count",
    });
    expect(controls).toHaveLength(2);
    controls.forEach((control) =>
      expect(control).toHaveAttribute("aria-pressed", "false"),
    );
  });
});
