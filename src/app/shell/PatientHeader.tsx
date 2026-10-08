import React from "react";
import { ViewMode, GeneralData, PatientStatus, Encounter } from "../../types";
import { Icons } from "../../components/ui/Icons";

interface PatientHeaderProps {
  patientInfo: GeneralData;
  activeEncounter?: Encounter;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onBack: () => void;
  onExport?: () => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientInfo,
  activeEncounter,
  currentView,
  onNavigate,
  onBack,
  onExport,
}) => {
  const tabs = [
    { id: ViewMode.PROFILE, label: "Profile", icon: Icons.General },
    { id: ViewMode.CHART, label: "Chart", icon: Icons.Document },
    { id: ViewMode.COURSE, label: "Timeline", icon: Icons.Clock },
    { id: ViewMode.HANDOFF, label: "Summary", icon: Icons.Clipboard },
    { id: ViewMode.ORDERS, label: "Orders", icon: Icons.ClipboardList },
    { id: ViewMode.NOTES, label: "Notes", icon: Icons.Edit3 },
  ];

  const getHospitalDay = (admissionDate: string, encounterStart?: string) => {
    // Prefer encounter start date if available for accurate readmission day counting
    const dateToUse = encounterStart || admissionDate;

    if (!dateToUse || dateToUse === "Not Recorded") return null;
    try {
      // Handle potential formats like "2026-03-02 20:45" or ISO "2026-05-11T10:30:00Z"
      const datePart = dateToUse.includes("T")
        ? dateToUse.split("T")[0]
        : dateToUse.split(" ")[0];
      const adm = new Date(datePart);
      const today = new Date();

      // Reset times to midnight for accurate day calculation
      adm.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - adm.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch (e) {
      return null;
    }
  };

  const hospitalDay = getHospitalDay(
    patientInfo.admissionDate,
    activeEncounter?.startDate,
  );

  return (
    <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border-default">
      <div className="w-full px-6">
        {/* Top Row: Back Button & Patient Identity */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 text-content-muted hover:text-action hover:bg-action-subtle rounded-xl transition-all group shrink-0"
              title="Back to Dashboard"
            >
              <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="h-8 w-px bg-surface-muted shrink-0"></div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-content-strong truncate">
                {patientInfo.patientName}
              </h2>
              <p className="text-[10px] font-bold text-content-secondary uppercase tracking-wider">
                {patientInfo.mrn} • {patientInfo.ageSex}
                {patientInfo.dob &&
                  patientInfo.dob !== "Not Recorded" &&
                  ` • ${patientInfo.dob}`}
                {patientInfo.location &&
                  patientInfo.location !== "Not Recorded" &&
                  ` • ${patientInfo.location}`}
                {patientInfo.bloodType &&
                  patientInfo.bloodType !== "Not Recorded" &&
                  ` • ${patientInfo.bloodType}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">
                <Icons.Clock className="w-3 h-3" />
                Adm:{" "}
                {activeEncounter
                  ? new Date(activeEncounter.startDate).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" },
                    )
                  : patientInfo.admissionDate}
              </div>
              <div className="flex items-center gap-2">
                {(!patientInfo.status ||
                  patientInfo.status === PatientStatus.ADMITTED) &&
                  hospitalDay !== null && (
                    <div className="text-[9px] font-bold text-action uppercase tracking-wider bg-action-subtle px-1.5 py-0.5 rounded border border-action-100/50">
                      ADMITTED • Day {hospitalDay}
                    </div>
                  )}
                {patientInfo.status === PatientStatus.OUTPATIENT && (
                  <div className="text-[9px] font-bold text-content-default uppercase tracking-wider bg-canvas px-1.5 py-0.5 rounded border border-border-subtle/50">
                    OUTPATIENT
                  </div>
                )}
                {patientInfo.status === PatientStatus.DISCHARGED && (
                  <div className="flex items-center gap-1.5">
                    <div className="text-[9px] font-bold text-content-default uppercase tracking-wider bg-surface-muted px-1.5 py-0.5 rounded border border-border-default/50">
                      DISCHARGED
                    </div>
                    {patientInfo.dischargeDate && (
                      <span className="text-[10px] text-content-secondary font-medium">
                        {patientInfo.dischargeDate}
                      </span>
                    )}
                  </div>
                )}
                {patientInfo.status === PatientStatus.DECEASED && (
                  <div className="flex items-center gap-1.5">
                    <div className="text-[9px] font-bold text-critical-600 uppercase tracking-wider bg-critical-50 px-1.5 py-0.5 rounded border border-critical-100/50 flex items-center gap-1">
                      <Icons.HeartOff className="w-3 h-3" />
                      DECEASED
                    </div>
                    {patientInfo.deceasedInfo && (
                      <span
                        className="text-[10px] text-content-secondary font-medium whitespace-nowrap"
                        title={`Cause (ICOD): ${patientInfo.deceasedInfo.causeOfDeath.icod}`}
                      >
                        {patientInfo.deceasedInfo.date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {onExport && (
              <div className="relative group/tooltip">
                <button
                  onClick={onExport}
                  aria-label="Download Full Record (JSON)"
                  className="p-2 text-content-muted hover:text-action hover:bg-action-subtle rounded-xl transition-all border border-transparent hover:border-action-100 shadow-sm hover:shadow active:scale-95"
                >
                  <Icons.Download className="w-4 h-4" />
                </button>
                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-neutral-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] shadow-xl">
                  Download Full Record (JSON)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Contextual Tabs */}
        <div className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  flex items-center px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "bg-action-subtle text-action-hover ring-1 ring-action-100"
                      : "text-content-secondary hover:bg-canvas hover:text-content-primary"
                  }
                `}
              >
                <Icon
                  className={`w-3.5 h-3.5 mr-2 ${isActive ? "text-action" : "text-content-muted"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
