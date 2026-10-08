import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MedicationStatus, OrderStatus } from "../types";
import OrderStatusDropdown from "../components/ui/OrderStatusDropdown";
import MedicationStatusDropdown from "../components/ui/MedicationStatusDropdown";

describe("shared portal status dropdowns", () => {
  it("keeps the order status option callback and trigger value", () => {
    const onChange = vi.fn();
    render(
      <OrderStatusDropdown status={OrderStatus.PENDING} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /PENDING/ }));
    fireEvent.click(screen.getByRole("button", { name: /DONE/ }));

    expect(onChange).toHaveBeenCalledWith(OrderStatus.DONE);
  });

  it("keeps medication status options and callback independent", () => {
    const onChange = vi.fn();
    render(
      <MedicationStatusDropdown
        status={MedicationStatus.ACTIVE}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /ACTIVE/ }));
    fireEvent.click(screen.getByRole("button", { name: /HOLD/ }));

    expect(onChange).toHaveBeenCalledWith(MedicationStatus.HOLD);
  });
});
