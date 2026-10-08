import React from "react";
import {
  MedicalChartResponse,
  ViewMode,
  PatientOrder,
  PatientStatus,
  DeceasedInfo,
} from "../../types";
import { Icons } from "../../components/ui/Icons";
import PatientStatusModal from "../../components/ui/modals/PatientStatusModal";
import StickyToolbar from "../../components/ui/StickyToolbar";
import Toast from "../../components/Toast";
import {
  ToolbarCount,
  ToolbarSearch,
  ToolbarFilterToggle,
  ToolbarButton,
} from "../../components/ui/ToolbarSections";
import TodayTasksSidebar from "../../components/TodayTasksSidebar";
import { getTodayLocalDateString } from "../../utils/date";

interface DashboardViewProps {
  patients: MedicalChartResponse[];
  onSelectPatient: (id: string, initialView?: ViewMode) => void;
  onUpdatePatientStatus: (
    id: string,
    status: PatientStatus,
    dischargeDateTime?: string,
    deceasedInfo?: DeceasedInfo,
  ) => void;
  onDeletePatient: (id: string) => void;
  onAddPatient: () => void;
  onUpdateOrder: (patientId: string, updatedOrder: PatientOrder) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  onSelectPatient,
  onUpdatePatientStatus,
  onDeletePatient,
  onAddPatient,
  onUpdateOrder,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [statusConfirm, setStatusConfirm] = React.useState<{
    id: string;
    action: "DISCHARGE" | "READMIT" | "CONSULT" | "DELETE" | "DECEASED";
  } | null>(null);
  const [activeKebabId, setActiveKebabId] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  // Click away listener for kebab menu
  React.useEffect(() => {
    const handleClickAway = () => setActiveKebabId(null);
    window.addEventListener("click", handleClickAway);
    return () => window.removeEventListener("click", handleClickAway);
  }, []);

  const todayStr = getTodayLocalDateString();

  const filteredPatients = React.useMemo(() => {
    return patients.filter((patient) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        patient.patientInfo.patientName.toLowerCase().includes(query) ||
        patient.patientInfo.mrn.toLowerCase().includes(query);

      let matchesDate = true;
      if (startDate || endDate) {
        const admissionTime = new Date(
          patient.patientInfo.admissionDate,
        ).getTime();
        if (isNaN(admissionTime)) {
          matchesDate = false;
        } else {
          const start = startDate ? new Date(startDate).getTime() : -Infinity;
          const end = endDate ? new Date(endDate).getTime() : Infinity;
          matchesDate = admissionTime >= start && admissionTime <= end;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [patients, searchQuery, startDate, endDate]);

  const activeAdvancedFilterCount = (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6 animate-slide-up-fade">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Content: Patients Grid */}
          <div className="flex-1 min-w-0">
            <StickyToolbar containerClassName="-mx-6 px-6 -mt-6 pt-6 pb-4 mb-8">
              <div className="flex items-center justify-between px-2 sm:px-4 py-2 min-h-[52px] overflow-x-auto no-scrollbar gap-2">
                <div className="flex items-center gap-1 sm:gap-4 flex-nowrap shrink-0">
                  <ToolbarCount
                    count={filteredPatients.length}
                    label="Patients"
                  />

                  <div className="h-4 w-px bg-slate-100 hidden sm:block"></div>

                  <div className="flex items-center gap-1 sm:gap-2 sm:flex-1 w-32 sm:w-auto relative">
                    <ToolbarSearch
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search by name or MRN..."
                      className="w-full flex"
                    />
                  </div>

                  <ToolbarFilterToggle
                    isExpanded={isFilterExpanded}
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    activeCount={activeAdvancedFilterCount}
                    hideLabelOnMobile={true}
                  />
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <ToolbarButton
                    onClick={onAddPatient}
                    icon={Icons.Plus}
                    label="Add Patient"
                    variant="primary"
                    hideLabelOnMobile={true}
                  />
                </div>
              </div>

              {isFilterExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/30 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 items-end gap-4">
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        max={endDate || todayStr}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        max={todayStr}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
                      />
                    </div>
                    <ToolbarButton
                      onClick={resetFilters}
                      icon={Icons.Refresh}
                      label="Reset"
                      variant="secondary"
                      className="h-[31px] justify-center"
                    />
                  </div>
                </div>
              )}
            </StickyToolbar>

            {filteredPatients.length === 0 ? (
              searchQuery || startDate || endDate ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl">
                  <Icons.Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500 font-medium">
                    No patients found matching your search
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-sm text-teal-600 font-bold hover:text-teal-700"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icons.General className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    No active patients
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto text-xs">
                    Start by adding your first patient
                  </p>
                  <button
                    onClick={onAddPatient}
                    className="mt-8 flex items-center px-6 py-2.5 text-teal-700 bg-teal-50 rounded-xl text-xs font-bold tracking-wide hover:bg-teal-100 transition-all active:scale-95 mx-auto"
                  >
                    Add Patient
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer relative"
                    onClick={() => onSelectPatient(patient.id)}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveKebabId(
                            activeKebabId === patient.id ? null : patient.id,
                          );
                        }}
                        aria-label="Patient actions"
                        className={`p-2 rounded-xl transition-all ${
                          activeKebabId === patient.id
                            ? "bg-transparent text-slate-600"
                            : "text-slate-300 hover:text-slate-600 hover:bg-transparent"
                        }`}
                      >
                        <Icons.Kebab className="w-4 h-4" />
                      </button>

                      {activeKebabId === patient.id && (
                        <div
                          className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2 animate-in fade-in slide-in-from-top-1 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(!patient.patientInfo.status ||
                            patient.patientInfo.status ===
                              PatientStatus.ADMITTED ||
                            patient.patientInfo.status ===
                              PatientStatus.OUTPATIENT) && (
                            <>
                              <button
                                onClick={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "DISCHARGE",
                                  });
                                  setActiveKebabId(null);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors uppercase tracking-wider"
                              >
                                <Icons.Home className="w-3.5 h-3.5 mr-3" />
                                Discharge
                              </button>
                              <button
                                onClick={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "DECEASED",
                                  });
                                  setActiveKebabId(null);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors uppercase tracking-wider"
                              >
                                <Icons.HeartOff className="w-3.5 h-3.5 mr-3" />
                                Deceased
                              </button>
                            </>
                          )}

                          {(patient.patientInfo.status ===
                            PatientStatus.DISCHARGED ||
                            patient.patientInfo.status ===
                              PatientStatus.DECEASED) && (
                            <>
                              <button
                                onClick={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "CONSULT",
                                  });
                                  setActiveKebabId(null);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors uppercase tracking-wider"
                              >
                                <Icons.ClipboardList className="w-3.5 h-3.5 mr-3" />
                                Consult
                              </button>
                              <button
                                onClick={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "READMIT",
                                  });
                                  setActiveKebabId(null);
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors uppercase tracking-wider"
                              >
                                <Icons.Plus className="w-3.5 h-3.5 mr-3" />
                                Readmit
                              </button>
                            </>
                          )}

                          <div className="h-px bg-slate-100 my-1 mx-2"></div>

                          <button
                            onClick={() => {
                              setStatusConfirm({
                                id: patient.id,
                                action: "DELETE",
                              });
                              setActiveKebabId(null);
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-[11px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors uppercase tracking-wider"
                          >
                            <Icons.Trash className="w-3.5 h-3.5 mr-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          !patient.patientInfo.status ||
                          patient.patientInfo.status === PatientStatus.ADMITTED
                            ? "bg-teal-50 text-teal-600"
                            : patient.patientInfo.status ===
                                PatientStatus.OUTPATIENT
                              ? "bg-slate-50 text-slate-600"
                              : patient.patientInfo.status ===
                                  PatientStatus.DECEASED
                                ? "bg-rose-50 text-rose-600"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {patient.patientInfo.status ===
                        PatientStatus.DECEASED ? (
                          <Icons.HeartOff className="w-6 h-6" />
                        ) : (
                          <Icons.General className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 pr-6">
                          <p
                            className="text-sm font-bold text-slate-900 truncate uppercase"
                            title={patient.patientInfo.patientName}
                          >
                            {patient.patientInfo.patientName}
                          </p>
                          {(!patient.patientInfo.status ||
                            patient.patientInfo.status ===
                              PatientStatus.ADMITTED) && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/50 shrink-0">
                              Admitted
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.OUTPATIENT && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100/50 shrink-0">
                              Outpatient
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.DISCHARGED && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 shrink-0">
                              Discharged
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.DECEASED && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50 shrink-0">
                              Deceased
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                          {patient.patientInfo.mrn} •{" "}
                          {patient.patientInfo.ageSex}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {patient.patientInfo.status === PatientStatus.DECEASED &&
                        patient.patientInfo.deceasedInfo && (
                          <div className="space-y-1.5 pt-1.5 border-b border-slate-100 font-medium">
                            <div className="flex items-center text-xs text-rose-600">
                              <Icons.HeartOff className="w-3.5 h-3.5 mr-2" />
                              Deceased: {
                                patient.patientInfo.deceasedInfo.date
                              }{" "}
                              {patient.patientInfo.deceasedInfo.time}
                            </div>
                          </div>
                        )}
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Icons.Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        Admitted: {patient.patientInfo.admissionDate}
                      </div>
                      {patient.patientInfo.status ===
                        PatientStatus.DISCHARGED &&
                        patient.patientInfo.dischargeDate && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Icons.Home className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Discharged: {patient.patientInfo.dischargeDate}
                          </div>
                        )}
                      {patient.patientInfo.location &&
                        patient.patientInfo.location !== "Not Recorded" && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Icons.MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Location: {patient.patientInfo.location}
                          </div>
                        )}
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Icons.Document className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        Entries: {patient.entries.length}
                      </div>
                      <div className="flex items-center gap-2 pr-6">
                        {patient.entries.length > 0 && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Icons.Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Latest Entry:{" "}
                            {patient.entries[0].date.substring(0, 10)}
                          </div>
                        )}
                        {patient.patientInfo.status !==
                          PatientStatus.DISCHARGED &&
                          patient.patientInfo.status !==
                            PatientStatus.DECEASED &&
                          (!patient.entries[0]?.date ||
                            !patient.entries[0].date.startsWith(todayStr)) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPatient(
                                  patient.id,
                                  ViewMode.APPEND_ENTRY,
                                );
                              }}
                              className="flex items-center text-[8px] text-teal-600 font-black uppercase tracking-widest bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/50 shrink-0 hover:bg-teal-100 transition-colors cursor-pointer"
                            >
                              UPDATE
                            </button>
                          )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      <button
                        className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-teal-50 hover:text-teal-700 transition-colors border border-transparent hover:border-teal-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.id, ViewMode.CHART);
                        }}
                      >
                        Chart
                      </button>
                      <button
                        className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-teal-50 hover:text-teal-700 transition-colors border border-transparent hover:border-teal-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.id, ViewMode.COURSE);
                        }}
                      >
                        Timeline
                      </button>
                      <button
                        className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-teal-50 hover:text-teal-700 transition-colors border border-transparent hover:border-teal-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.id, ViewMode.ORDERS);
                        }}
                      >
                        Orders
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Today's Tasks */}
          <TodayTasksSidebar
            patients={patients}
            onUpdateOrder={onUpdateOrder}
            onSelectPatient={onSelectPatient}
          />
        </div>
      </div>

      {/* Status Action Confirmation Modal */}
      <PatientStatusModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        action={statusConfirm ? statusConfirm.action : null}
        onConfirm={(data) => {
          if (statusConfirm) {
            if (statusConfirm.action === "DELETE") {
              onDeletePatient(statusConfirm.id);
              setSuccessMessage("Patient record deleted successfully");
            } else if (statusConfirm.action === "DECEASED") {
              onUpdatePatientStatus(
                statusConfirm.id,
                PatientStatus.DECEASED,
                undefined,
                data.deceasedInfo,
              );
              setSuccessMessage("Patient marked as deceased successfully");
            } else {
              const mappedStatus =
                statusConfirm.action === "DISCHARGE"
                  ? PatientStatus.DISCHARGED
                  : statusConfirm.action === "READMIT"
                    ? PatientStatus.ADMITTED
                    : PatientStatus.OUTPATIENT;

              onUpdatePatientStatus(
                statusConfirm.id,
                mappedStatus,
                data.dischargeDateTime,
              );

              const message =
                mappedStatus === PatientStatus.DISCHARGED
                  ? "Patient discharged successfully"
                  : mappedStatus === PatientStatus.ADMITTED
                    ? "Patient admitted successfully"
                    : "Patient registered for outpatient consult";
              setSuccessMessage(message);
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

export default DashboardView;
