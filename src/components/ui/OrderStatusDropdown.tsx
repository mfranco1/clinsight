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
      return "bg-canvas text-content-primary border-border-default";
    case OrderStatus.ONGOING:
      return "bg-info-50 text-info-700 border-info-200";
    case OrderStatus.DONE:
      return "bg-action-subtle text-action-hover border-action-border";
    case OrderStatus.DEFERRED:
      return "bg-warning-50 text-warning-700 border-warning-200";
    case OrderStatus.FAILED:
      return "bg-critical-50 text-critical-700 border-critical-200";
    case OrderStatus.WAITING:
      return "bg-pending-50 text-pending-700 border-pending-200";
    case OrderStatus.PAUSED:
      return "bg-surface-muted text-content-secondary border-border-default";
    default:
      return "bg-canvas text-content-primary border-border-subtle";
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
