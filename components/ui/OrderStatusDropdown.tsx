import type { FC } from "react";
import { OrderStatus } from "../../types";
import StatusDropdown from "./StatusDropdown";

interface OrderStatusDropdownProps {
  status: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
  isDesktop?: boolean;
  className?: string;
}

export const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return "bg-slate-50 text-slate-700 border-slate-200";
    case OrderStatus.ONGOING:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case OrderStatus.DONE:
      return "bg-teal-50 text-teal-700 border-teal-200";
    case OrderStatus.DEFERRED:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case OrderStatus.FAILED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case OrderStatus.WAITING:
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case OrderStatus.PAUSED:
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const OrderStatusDropdown: FC<OrderStatusDropdownProps> = ({
  status,
  onChange,
  isDesktop = false,
  className = "",
}) => {
  return (
    <StatusDropdown
      status={status}
      options={Object.values(OrderStatus)}
      onChange={onChange}
      getTriggerColor={getStatusColor}
      isDesktop={isDesktop}
      className={className}
    />
  );
};

export default OrderStatusDropdown;
