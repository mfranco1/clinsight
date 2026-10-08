import React from "react";
import { DeceasedInfo, GeneralData, PatientStatus } from "../../types";
import GeneralDataSection from "./components/GeneralDataSection";
import { Icons } from "../../components/ui/Icons";
import PatientStatusModal from "../../components/ui/modals/PatientStatusModal";
import Toast from "../../components/Toast";

interface ProfileViewProps {
  patientInfo: GeneralData;
  onUpdatePatient?: (updatedInfo: GeneralData) => void;
  onUpdatePatientStatus?: (
    id: string,
    status: PatientStatus,
    dischargeDateTime?: string,
    deceasedInfo?: DeceasedInfo,
  ) => void;
  onDeletePatient?: (id: string) => void;
  patientId: string;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  patientInfo,
  onUpdatePatient,
  onUpdatePatientStatus,
  onDeletePatient,
  patientId,
}) => {
  const [statusConfirm, setStatusConfirm] = React.useState<{
    action: "DISCHARGE" | "READMIT" | "CONSULT" | "DELETE" | "DECEASED";
  } | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  const handleUpdateStatus = (
    status: PatientStatus,
    dischargeDateTime?: string,
    deceasedInfo?: DeceasedInfo,
  ) => {
    if (onUpdatePatientStatus) {
      onUpdatePatientStatus(patientId, status, dischargeDateTime, deceasedInfo);
    } else if (onUpdatePatient) {
      onUpdatePatient({
        ...patientInfo,
        status,
        dischargeDate:
          status === PatientStatus.DISCHARGED ? dischargeDateTime : undefined,
        deceasedInfo:
          status === PatientStatus.DECEASED ? deceasedInfo : undefined,
      });
    }

    // Set success message based on status
    const message =
      status === PatientStatus.DISCHARGED
        ? "Patient discharged successfully"
        : status === PatientStatus.ADMITTED
          ? "Patient admitted successfully"
          : status === PatientStatus.DECEASED
            ? "Patient marked as deceased successfully"
            : "Patient registered for outpatient consult";
    setSuccessMessage(message);
  };

  const currentStatus = patientInfo.status || PatientStatus.ADMITTED;

  return (
    <>
      <div
        id="profile-view-scroll-container"
        className="flex-1 overflow-y-auto bg-slate-50/30 animate-slide-up-fade relative flex flex-col main-scroll-container"
      >
        <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
          {/* Status Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            <button
              onClick={() => setStatusConfirm({ action: "DELETE" })}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm w-full sm:w-auto sm:mr-auto justify-center mb-1 sm:mb-0"
              title="Permanently remove this patient record"
            >
              <Icons.Trash className="w-4 h-4 mr-2" />
              Delete Record
            </button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
              {currentStatus !== PatientStatus.DISCHARGED &&
                currentStatus !== PatientStatus.DECEASED && (
                  <>
                    <button
                      onClick={() => setStatusConfirm({ action: "DISCHARGE" })}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm min-w-[120px]"
                    >
                      <Icons.Home className="w-4 h-4 mr-2" />
                      Discharge
                    </button>
                    <button
                      onClick={() => setStatusConfirm({ action: "DECEASED" })}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm min-w-[120px]"
                    >
                      <Icons.HeartOff className="w-4 h-4 mr-2" />
                      Deceased
                    </button>
                  </>
                )}

              {(currentStatus === PatientStatus.DISCHARGED ||
                currentStatus === PatientStatus.DECEASED) && (
                <>
                  <button
                    onClick={() => setStatusConfirm({ action: "CONSULT" })}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm min-w-[120px]"
                  >
                    <Icons.ClipboardList className="w-4 h-4 mr-2" />
                    Consult
                  </button>
                  <button
                    onClick={() => setStatusConfirm({ action: "READMIT" })}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm min-w-[100px]"
                  >
                    <Icons.Plus className="w-4 h-4 mr-2" />
                    Readmit
                  </button>
                </>
              )}

              {currentStatus === PatientStatus.OUTPATIENT && (
                <button
                  onClick={() => setStatusConfirm({ action: "READMIT" })}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm min-w-[120px]"
                >
                  <Icons.Plus className="w-4 h-4 mr-2" />
                  Admit Patient
                </button>
              )}
            </div>
          </div>

          <GeneralDataSection data={patientInfo} onUpdate={onUpdatePatient} />
        </div>
      </div>

      <PatientStatusModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        action={statusConfirm ? statusConfirm.action : null}
        onConfirm={(data) => {
          if (statusConfirm) {
            if (statusConfirm.action === "DELETE") {
              if (onDeletePatient) onDeletePatient(patientId);
            } else if (statusConfirm.action === "DECEASED") {
              handleUpdateStatus(
                PatientStatus.DECEASED,
                undefined,
                data.deceasedInfo,
              );
            } else {
              const mappedStatus =
                statusConfirm.action === "DISCHARGE"
                  ? PatientStatus.DISCHARGED
                  : statusConfirm.action === "READMIT"
                    ? PatientStatus.ADMITTED
                    : PatientStatus.OUTPATIENT;

              handleUpdateStatus(mappedStatus, data.dischargeDateTime);
            }
            setStatusConfirm(null);
          }
        }}
      />

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
};

export default ProfileView;
