import { useCallback, useState } from "react";
import { useToast } from "../../components/ui/ToastProvider";
import { PatientStatus } from "../../types";

export type ChartStatusConfirmation = {
  action: "READMIT" | "CONSULT" | "REACTIVATE";
};

export function useChartStatusActions(
  onUpdatePatientStatus?: (status: PatientStatus) => void,
) {
  const [statusConfirm, setStatusConfirm] =
    useState<ChartStatusConfirmation | null>(null);
  const { showToast } = useToast();

  const updatePatientStatus = useCallback(
    (status: PatientStatus) => {
      if (onUpdatePatientStatus) {
        onUpdatePatientStatus(status);
        showToast(
          status === PatientStatus.ADMITTED
            ? "Patient readmitted successfully"
            : "New consult started successfully",
          { type: "success" },
        );
      }
      setStatusConfirm(null);
    },
    [onUpdatePatientStatus, showToast],
  );

  return {
    statusConfirm,
    setStatusConfirm,
    updatePatientStatus,
  };
}
