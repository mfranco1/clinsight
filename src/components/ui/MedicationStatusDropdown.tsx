import type { FC } from "react";
import { MedicationStatus } from "../../types";
import StatusDropdown from "./StatusDropdown";

interface MedicationStatusDropdownProps {
  status: MedicationStatus;
  onChange: (newStatus: MedicationStatus) => void;
  isDesktop?: boolean;
  className?: string;
}

const getMedStatusColor = (status: MedicationStatus) => {
  switch (status) {
    case MedicationStatus.ACTIVE:
      return "bg-action-subtle text-action-hover border-action-border";
    case MedicationStatus.HOLD:
      return "bg-warning-50 text-warning-700 border-warning-200";
    case MedicationStatus.DISCONTINUED:
      return "bg-critical-50 text-critical-700 border-critical-200";
    case MedicationStatus.COMPLETED:
      return "bg-canvas text-content-primary border-border-default";
    default:
      return "bg-canvas text-content-primary border-border-subtle";
  }
};

const MedicationStatusDropdown: FC<MedicationStatusDropdownProps> = ({
  status,
  onChange,
  isDesktop = false,
  className = "",
}) => {
  return (
    <StatusDropdown
      status={status}
      options={Object.values(MedicationStatus)}
      onChange={onChange}
      getTriggerColor={getMedStatusColor}
      isDesktop={isDesktop}
      className={className}
    />
  );
};

export default MedicationStatusDropdown;
