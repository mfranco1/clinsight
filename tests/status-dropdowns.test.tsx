import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MedicationStatus, OrderStatus } from "../src/types";
import OrderStatusDropdown from "../src/components/ui/OrderStatusDropdown";
import MedicationStatusDropdown from "../src/components/ui/MedicationStatusDropdown";

describe("shared portal status dropdowns", () => {
  it("keeps the order status option callback and trigger value", () => {
    const onChange = vi.fn();
    render(
      <OrderStatusDropdown status={OrderStatus.PENDING} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "PENDING" }));
    fireEvent.click(screen.getByRole("option", { name: "DONE" }));

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

    fireEvent.click(screen.getByRole("combobox", { name: "ACTIVE" }));
    fireEvent.click(screen.getByRole("option", { name: "HOLD" }));

    expect(onChange).toHaveBeenCalledWith(MedicationStatus.HOLD);
  });

  it("does not activate a containing row when selecting a status", () => {
    const onRowClick = vi.fn();
    const onChange = vi.fn();
    render(
      <div onClick={onRowClick}>
        <OrderStatusDropdown
          status={OrderStatus.PENDING}
          onChange={onChange}
          ariaLabel="Status for order CBC"
        />
      </div>,
    );

    fireEvent.click(
      screen.getByRole("combobox", { name: "Status for order CBC" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "DONE" }));

    expect(onChange).toHaveBeenCalledWith(OrderStatus.DONE);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
