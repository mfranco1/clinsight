import { act, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatientStatus } from "../src/types";
import { useChartStatusActions } from "../src/features/chart/useChartStatusActions";
import { ToastProvider } from "../src/components/ui/ToastProvider";

const wrapper = ({ children }: React.PropsWithChildren) => (
  <ToastProvider>{children}</ToastProvider>
);

describe("useChartStatusActions", () => {
  it("updates status, clears confirmation, and announces success", () => {
    const onUpdatePatientStatus = vi.fn();
    const { result } = renderHook(
      () => useChartStatusActions(onUpdatePatientStatus),
      { wrapper },
    );

    act(() => result.current.setStatusConfirm({ action: "READMIT" }));
    act(() => result.current.updatePatientStatus(PatientStatus.ADMITTED));

    expect(onUpdatePatientStatus).toHaveBeenCalledWith(PatientStatus.ADMITTED);
    expect(result.current.statusConfirm).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Patient readmitted successfully",
    );
  });

  it("clears confirmation without showing success when no handler is provided", () => {
    const { result } = renderHook(() => useChartStatusActions(), { wrapper });

    act(() => result.current.setStatusConfirm({ action: "CONSULT" }));
    act(() => result.current.updatePatientStatus(PatientStatus.OUTPATIENT));

    expect(result.current.statusConfirm).toBeNull();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
