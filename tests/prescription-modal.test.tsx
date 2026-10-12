import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrescriptionModal from "../src/features/orders/components/PrescriptionModal";
import { MedicationStatus } from "../src/types";

describe("PrescriptionModal", () => {
  it("keeps the editor open on Escape and outside interaction, with an explicit close control", async () => {
    const onClose = vi.fn();
    render(
      <PrescriptionModal
        isOpen
        onClose={onClose}
        patientName="Synthetic Patient"
        patientAddress=""
        ageSex=""
        date="2026-10-12"
        medications={[]}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Prescription" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses a nested confirmation for deleting an item and retains it on cancel", async () => {
    render(
      <PrescriptionModal
        isOpen
        onClose={vi.fn()}
        patientName="Synthetic Patient"
        patientAddress=""
        ageSex=""
        date="2026-10-12"
        medications={[
          {
            id: "med-1",
            drug: "Amoxicillin",
            dose: "500 mg",
            route: "PO",
            frequency: "BID",
            duration: "7 days",
            status: MedicationStatus.ACTIVE,
            prescribedDate: "2026-10-12",
            prescribedBy: "Dr. Example",
          },
        ]}
      />,
    );

    await screen.findByPlaceholderText("Medication Name");
    fireEvent.click(screen.getByTitle("Remove Item"));
    expect(
      screen.getByRole("dialog", { name: "Delete Item?" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Delete Item?" })).toBeNull(),
    );
    expect(screen.getByPlaceholderText("Medication Name")).toBeInTheDocument();
  });
});
