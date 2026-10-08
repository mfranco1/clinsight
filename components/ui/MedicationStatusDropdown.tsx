import type { FC } from "react";
import { MedicationStatus } from "../../types";
import StatusDropdown from "./StatusDropdown";

interface MedicationStatusDropdownProps {
  status: MedicationStatus;
  onChange: (newStatus: MedicationStatus) => void;
  isDesktop?: boolean;
  className?: string;
}

export const getMedStatusColor = (status: MedicationStatus) => {
  switch (status) {
    case MedicationStatus.ACTIVE:
      return "bg-teal-50 text-teal-700 border-teal-200";
    case MedicationStatus.HOLD:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case MedicationStatus.DISCONTINUED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case MedicationStatus.COMPLETED:
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
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
