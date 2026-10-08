import { useCallback, useState } from "react";
import { PatientStatus } from "../../types";

export type ChartStatusConfirmation = {
  action: "READMIT" | "CONSULT" | "REACTIVATE";
};

export function useChartStatusActions(
  onUpdatePatientStatus?: (status: PatientStatus) => void,
) {
  const [statusConfirm, setStatusConfirm] =
    useState<ChartStatusConfirmation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updatePatientStatus = useCallback(
    (status: PatientStatus) => {
      if (onUpdatePatientStatus) {
        onUpdatePatientStatus(status);
        setSuccessMessage(
          status === PatientStatus.ADMITTED
            ? "Patient readmitted successfully"
            : "New consult started successfully",
        );
      }
      setStatusConfirm(null);
    },
    [onUpdatePatientStatus],
  );

  return {
    statusConfirm,
    setStatusConfirm,
    successMessage,
    setSuccessMessage,
    updatePatientStatus,
  };
}
