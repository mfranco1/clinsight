import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TodayTasksSidebar from "../src/features/dashboard/components/TodayTasksSidebar";
import { getTodayLocalDateString } from "../src/utils/date";
import { OrderStatus, type MedicalChartResponse } from "../src/types";
import { structuredPatientCase } from "./fixtures/patient-cases";

describe("TodayTasksSidebar", () => {
  it("labels each order status control with its order name", () => {
    const todayNoon = new Date(`${getTodayLocalDateString()}T12:00:00`);
    const patient: MedicalChartResponse = {
      ...structuredPatientCase,
      orders: [
        {
          id: "order-cbc",
          name: "Complete blood count",
          dateOrdered: todayNoon.toISOString(),
          targetDate: todayNoon.toISOString(),
          status: OrderStatus.PENDING,
          notes: "",
        },
      ],
    };

    render(
      <TodayTasksSidebar
        patients={[patient]}
        onUpdateOrder={vi.fn()}
        onSelectPatient={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", {
        name: "Status for order Complete blood count",
      }),
    ).toBeInTheDocument();
  });
});
