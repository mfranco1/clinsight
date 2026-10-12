import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrdersView from "../src/features/orders/OrdersView";
import { ViewStateProvider } from "../src/app/ViewState";
import {
  MedicationStatus,
  OrderStatus,
  PatientStatus,
  type MedicationOrder,
  type PatientOrder,
} from "../src/types";

const createOrder = (id: string, name: string): PatientOrder => ({
  id,
  encounterId: "encounter-selection-test",
  name,
  dateOrdered: "2026-10-12T08:00:00.000Z",
  targetDate: "2026-10-12T09:00:00.000Z",
  status: OrderStatus.PENDING,
  notes: "",
  category: "Lab",
});

const createMedication = (id: string, drug: string): MedicationOrder => ({
  id,
  encounterId: "encounter-selection-test",
  drug,
  dose: "500 mg",
  route: "PO",
  frequency: "BID",
  duration: "7 days",
  status: MedicationStatus.ACTIVE,
  prescribedDate: "2026-10-12",
  prescribedBy: "Synthetic Clinician",
  notes: "Take with food",
});

const selectionTestPatientInfo = {
  patientName: "Selection Test",
  ageSex: "42/M",
  age: 42,
  sex: "M",
  mrn: "SELECTION-001",
  dob: "1984-01-10",
  admissionDate: "2026-10-12 08:00",
  address: "Not Recorded",
  religion: "Not Recorded",
  handedness: "Not Recorded",
  location: "Ward A",
  status: PatientStatus.ADMITTED,
};

describe("OrdersView selection lifecycle", () => {
  it("groups only selected diagnostic orders and preserves the latest target date", () => {
    const orders = [
      {
        ...createOrder("order-group-1", "First selected order"),
        targetDate: "2026-10-10T09:00:00.000Z",
      },
      {
        ...createOrder("order-group-middle", "Unselected order"),
        targetDate: "2026-10-11T09:00:00.000Z",
      },
      {
        ...createOrder("order-group-3", "Last selected order"),
        targetDate: "2026-10-12T09:00:00.000Z",
      },
    ];
    const onUpdateOrders = vi.fn();
    const patientInfo = {
      patientName: "Grouping Test",
      ageSex: "42/M",
      age: 42,
      sex: "M",
      mrn: "GROUP-001",
      dob: "1984-01-10",
      admissionDate: "2026-10-12 08:00",
      address: "Not Recorded",
      religion: "Not Recorded",
      handedness: "Not Recorded",
      location: "Ward A",
      status: PatientStatus.ADMITTED,
    };
    render(
      <ViewStateProvider>
        <OrdersView
          patientId="patient-group-test"
          orders={orders}
          medications={[]}
          encounters={[]}
          onUpdateOrders={onUpdateOrders}
          onUpdateMedications={vi.fn()}
          patientInfo={patientInfo}
        />
      </ViewStateProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    for (const name of ["First selected order", "Last selected order"]) {
      fireEvent.click(
        screen.getAllByRole("button", { name: `Select order ${name}` })[0],
      );
    }
    fireEvent.click(screen.getByRole("button", { name: "Group" }));

    const groupedOrders = onUpdateOrders.mock.calls[0][0] as PatientOrder[];
    expect(groupedOrders.map((order) => order.id)).toEqual([
      "order-group-1",
      "order-group-3",
      "order-group-middle",
    ]);
    const selectedOrders = groupedOrders.filter((order) => order.groupId);
    expect(selectedOrders).toHaveLength(2);
    expect(selectedOrders[0].groupId).toBe(selectedOrders[1].groupId);
    expect(selectedOrders.map((order) => order.targetDate)).toEqual([
      orders[2].targetDate,
      orders[2].targetDate,
    ]);
    const unselectedOrder = groupedOrders.find(
      (order) => order.id === "order-group-middle",
    );
    expect(unselectedOrder).toMatchObject({ targetDate: orders[1].targetDate });
    expect(unselectedOrder).not.toHaveProperty("groupId");
    expect(
      screen.queryByRole("group", { name: "Actions for selected records" }),
    ).not.toBeInTheDocument();
  });

  it("drops deleted records from selection and clears selection on patient change", () => {
    const orders = [
      createOrder("order-selection-1", "CBC"),
      createOrder("order-selection-2", "Metabolic panel"),
      createOrder("order-selection-3", "Urinalysis"),
    ];
    const onUpdateOrders = vi.fn();
    const onUpdateMedications = vi.fn();
    const renderView = (patientId: string, currentOrders: PatientOrder[]) => (
      <ViewStateProvider>
        <OrdersView
          patientId={patientId}
          orders={currentOrders}
          medications={[]}
          encounters={[]}
          onUpdateOrders={onUpdateOrders}
          onUpdateMedications={onUpdateMedications}
          patientInfo={{ ...selectionTestPatientInfo, mrn: patientId }}
        />
      </ViewStateProvider>
    );
    const view = render(renderView("patient-selection-a", orders));

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    for (const name of ["CBC", "Metabolic panel", "Urinalysis"]) {
      fireEvent.click(
        screen.getAllByRole("button", { name: `Select order ${name}` })[0],
      );
    }

    expect(
      screen.getByRole("group", { name: "Actions for selected records" }),
    ).toHaveTextContent("3 Orders");
    const search = screen.getByRole("textbox", { name: "Search diagnostics" });
    fireEvent.change(search, { target: { value: "Urinalysis" } });
    expect(
      screen.getByRole("group", { name: "Actions for selected records" }),
    ).toHaveTextContent("3 Orders");
    expect(screen.queryByText("CBC", { exact: true })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Delete order CBC" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Order" }));
    expect(onUpdateOrders).toHaveBeenCalledWith(orders.slice(1));

    view.rerender(renderView("patient-selection-a", orders.slice(1)));
    expect(
      screen.getByRole("group", { name: "Actions for selected records" }),
    ).toHaveTextContent("2 Orders");

    // Reuse the same order IDs to make sure patient identity, rather than ID
    // coincidence, scopes the selection.
    view.rerender(renderView("patient-selection-b", orders.slice(1)));
    expect(
      screen.queryByRole("group", { name: "Actions for selected records" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
  });

  it("deletes only selected medications and keeps their exact workflow values out of the deletion scope", () => {
    const medications = [
      createMedication("medication-selection-1", "Selected medication one"),
      createMedication("medication-selection-2", "Selected medication two"),
      createMedication("medication-selection-3", "Unselected medication"),
    ];
    const onUpdateMedications = vi.fn();
    render(
      <ViewStateProvider>
        <OrdersView
          patientId="patient-medication-selection"
          orders={[]}
          medications={medications}
          encounters={[]}
          onUpdateOrders={vi.fn()}
          onUpdateMedications={onUpdateMedications}
          patientInfo={selectionTestPatientInfo}
        />
      </ViewStateProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Medications" }));
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Select medication Selected medication one",
      })[0],
    );
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Select medication Selected medication two",
      })[0],
    );

    expect(
      screen.getByRole("group", { name: "Actions for selected records" }),
    ).toHaveTextContent("2 Meds");
    expect(
      screen.queryByRole("button", { name: /^Group$/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByText(/delete the 2 selected medications/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));

    expect(onUpdateMedications).toHaveBeenCalledWith([medications[2]]);
    expect(onUpdateMedications.mock.calls[0][0][0]).toMatchObject({
      drug: "Unselected medication",
      dose: "500 mg",
      route: "PO",
      frequency: "BID",
      duration: "7 days",
      notes: "Take with food",
    });
  });
});
