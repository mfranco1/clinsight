import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatientStatus } from "../src/types";
import { useChartStatusActions } from "../src/features/chart/useChartStatusActions";

describe("useChartStatusActions", () => {
  it("updates status, clears confirmation, and keeps the existing success message", () => {
    const onUpdatePatientStatus = vi.fn();
    const { result } = renderHook(() =>
      useChartStatusActions(onUpdatePatientStatus),
    );

    act(() => result.current.setStatusConfirm({ action: "READMIT" }));
    act(() => result.current.updatePatientStatus(PatientStatus.ADMITTED));

    expect(onUpdatePatientStatus).toHaveBeenCalledWith(PatientStatus.ADMITTED);
    expect(result.current.statusConfirm).toBeNull();
    expect(result.current.successMessage).toBe(
      "Patient readmitted successfully",
    );
  });

  it("clears confirmation without showing success when no handler is provided", () => {
    const { result } = renderHook(() => useChartStatusActions());

    act(() => result.current.setStatusConfirm({ action: "CONSULT" }));
    act(() => result.current.updatePatientStatus(PatientStatus.OUTPATIENT));

    expect(result.current.statusConfirm).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });
});
