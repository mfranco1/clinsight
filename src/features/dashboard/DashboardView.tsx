import React from "react";
import { useRetainedState } from "../../app/ViewState";
import {
  MedicalChartResponse,
  ViewMode,
  PatientOrder,
  PatientStatus,
  DeceasedInfo,
} from "../../types";
import { Icons } from "../../components/ui/Icons";
import PatientStatusModal from "../../components/dialogs/PatientStatusModal";
import StickyToolbar from "../../components/ui/StickyToolbar";
import { useToast } from "../../components/ui/ToastProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";
import {
  ToolbarCount,
  ToolbarSearch,
  ToolbarFilterToggle,
  ToolbarButton,
} from "../../components/ui/ToolbarSections";
import TodayTasksSidebar from "./components/TodayTasksSidebar";
import { getTodayLocalDateString } from "../../utils/date";
import EmptyState from "../../components/ui/EmptyState";

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
  const [searchQuery, setSearchQuery] = useRetainedState(
    "dashboard:search",
    "",
  );
  const [isFilterExpanded, setIsFilterExpanded] = useRetainedState(
    "dashboard:filter-expanded",
    false,
  );
  const [startDate, setStartDate] = useRetainedState(
    "dashboard:start-date",
    "",
  );
  const [endDate, setEndDate] = useRetainedState("dashboard:end-date", "");
  const [statusConfirm, setStatusConfirm] = React.useState<{
    id: string;
    action: "DISCHARGE" | "READMIT" | "CONSULT" | "DELETE" | "DECEASED";
  } | null>(null);
  const [activeKebabId, setActiveKebabId] = React.useState<string | null>(null);
  const { showToast } = useToast();

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

                  <div className="h-4 w-px bg-surface-muted hidden sm:block"></div>

                  <div className="flex items-center gap-1 sm:gap-2 sm:flex-1 w-32 sm:w-auto relative">
                    <ToolbarSearch
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onClear={() => setSearchQuery("")}
                      label="Search patients"
                      placeholder="Search by name or MRN..."
                      className="w-full flex"
                    />
                  </div>

                  <ToolbarFilterToggle
                    isExpanded={isFilterExpanded}
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    activeCount={activeAdvancedFilterCount}
                    hideLabelOnMobile={true}
                    ariaLabel="Filter patients"
                    controlsId="dashboard-filters"
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
                <div
                  id="dashboard-filters"
                  className="px-4 pb-4 pt-2 border-t border-neutral-50 bg-canvas/30 animate-fade-in"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 items-end gap-4">
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1 ml-0.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        max={endDate || todayStr}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-border-default bg-surface rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-focus-ring focus:border-action outline-none text-content-primary shadow-sm transition-all w-full h-[31px]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1 ml-0.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        max={todayStr}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-border-default bg-surface rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-focus-ring focus:border-action outline-none text-content-primary shadow-sm transition-all w-full h-[31px]"
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
                <EmptyState
                  icon={Icons.Search}
                  title="No patients found matching your search"
                  action={{ onClick: resetFilters, label: "Clear all filters" }}
                />
              ) : (
                <EmptyState
                  icon={Icons.General}
                  title="No active patients"
                  description="Start by adding your first patient"
                  action={{ onClick: onAddPatient, label: "Add Patient" }}
                  className="py-20"
                />
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-surface border border-border-default rounded-3xl p-6 hover:shadow-xl hover:shadow-neutral-200/50 transition-all group cursor-pointer relative"
                    onClick={() => onSelectPatient(patient.id)}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <DropdownMenu
                        open={activeKebabId === patient.id}
                        onOpenChange={(open) =>
                          setActiveKebabId(open ? patient.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Patient actions"
                            className={`p-2 rounded-xl transition-all ${
                              activeKebabId === patient.id
                                ? "bg-transparent text-content-default"
                                : "text-neutral-300 hover:text-content-default hover:bg-transparent"
                            }`}
                          >
                            <Icons.Kebab className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-48 rounded-2xl py-2 shadow-neutral-200/50"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {(!patient.patientInfo.status ||
                            patient.patientInfo.status ===
                              PatientStatus.ADMITTED ||
                            patient.patientInfo.status ===
                              PatientStatus.OUTPATIENT) && (
                            <>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "DISCHARGE",
                                  });
                                }}
                                variant="destructive"
                                className="text-[11px]"
                              >
                                <Icons.Home className="w-3.5 h-3.5 mr-3" />
                                Discharge
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "DECEASED",
                                  });
                                }}
                                variant="destructive"
                                className="text-[11px]"
                              >
                                <Icons.HeartOff className="w-3.5 h-3.5 mr-3" />
                                Deceased
                              </DropdownMenuItem>
                            </>
                          )}

                          {(patient.patientInfo.status ===
                            PatientStatus.DISCHARGED ||
                            patient.patientInfo.status ===
                              PatientStatus.DECEASED) && (
                            <>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "CONSULT",
                                  });
                                }}
                                className="text-[11px]"
                              >
                                <Icons.ClipboardList className="w-3.5 h-3.5 mr-3" />
                                Consult
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatusConfirm({
                                    id: patient.id,
                                    action: "READMIT",
                                  });
                                }}
                                className="text-[11px]"
                              >
                                <Icons.Plus className="w-3.5 h-3.5 mr-3" />
                                Readmit
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator className="mx-2" />

                          <DropdownMenuItem
                            onSelect={() => {
                              setStatusConfirm({
                                id: patient.id,
                                action: "DELETE",
                              });
                            }}
                            variant="destructive"
                            className="text-[11px]"
                          >
                            <Icons.Trash className="w-3.5 h-3.5 mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          !patient.patientInfo.status ||
                          patient.patientInfo.status === PatientStatus.ADMITTED
                            ? "bg-action-subtle text-action"
                            : patient.patientInfo.status ===
                                PatientStatus.OUTPATIENT
                              ? "bg-canvas text-content-default"
                              : patient.patientInfo.status ===
                                  PatientStatus.DECEASED
                                ? "bg-critical-50 text-critical-600"
                                : "bg-surface-muted text-content-secondary"
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
                            className="text-sm font-bold text-content-strong truncate uppercase"
                            title={patient.patientInfo.patientName}
                          >
                            {patient.patientInfo.patientName}
                          </p>
                          {(!patient.patientInfo.status ||
                            patient.patientInfo.status ===
                              PatientStatus.ADMITTED) && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-action bg-action-subtle px-1.5 py-0.5 rounded border border-action-100/50 shrink-0">
                              Admitted
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.OUTPATIENT && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-content-default bg-canvas px-1.5 py-0.5 rounded border border-border-subtle/50 shrink-0">
                              Outpatient
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.DISCHARGED && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-content-secondary bg-surface-muted px-1.5 py-0.5 rounded border border-border-default/50 shrink-0">
                              Discharged
                            </span>
                          )}
                          {patient.patientInfo.status ===
                            PatientStatus.DECEASED && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-critical-600 bg-critical-50 px-1.5 py-0.5 rounded border border-critical-100/50 shrink-0">
                              Deceased
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-content-secondary uppercase tracking-wider mt-0.5">
                          {patient.patientInfo.mrn} •{" "}
                          {patient.patientInfo.ageSex}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {patient.patientInfo.status === PatientStatus.DECEASED &&
                        patient.patientInfo.deceasedInfo && (
                          <div className="space-y-1.5 pt-1.5 border-b border-border-subtle font-medium">
                            <div className="flex items-center text-xs text-critical-600">
                              <Icons.HeartOff className="w-3.5 h-3.5 mr-2" />
                              Deceased: {
                                patient.patientInfo.deceasedInfo.date
                              }{" "}
                              {patient.patientInfo.deceasedInfo.time}
                            </div>
                          </div>
                        )}
                      <div className="flex items-center text-xs text-content-secondary font-medium">
                        <Icons.Calendar className="w-3.5 h-3.5 mr-2 text-content-muted" />
                        Admitted: {patient.patientInfo.admissionDate}
                      </div>
                      {patient.patientInfo.status ===
                        PatientStatus.DISCHARGED &&
                        patient.patientInfo.dischargeDate && (
                          <div className="flex items-center text-xs text-content-secondary font-medium">
                            <Icons.Home className="w-3.5 h-3.5 mr-2 text-content-muted" />
                            Discharged: {patient.patientInfo.dischargeDate}
                          </div>
                        )}
                      {patient.patientInfo.location &&
                        patient.patientInfo.location !== "Not Recorded" && (
                          <div className="flex items-center text-xs text-content-secondary font-medium">
                            <Icons.MapPin className="w-3.5 h-3.5 mr-2 text-content-muted" />
                            Location: {patient.patientInfo.location}
                          </div>
                        )}
                      <div className="flex items-center text-xs text-content-secondary font-medium">
                        <Icons.Document className="w-3.5 h-3.5 mr-2 text-content-muted" />
                        Entries: {patient.entries.length}
                      </div>
                      <div className="flex items-center gap-2 pr-6">
                        {patient.entries.length > 0 && (
                          <div className="flex items-center text-xs text-content-secondary font-medium">
                            <Icons.Clock className="w-3.5 h-3.5 mr-2 text-content-muted" />
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
                              className="flex items-center text-[8px] text-action font-black uppercase tracking-widest bg-action-subtle px-1.5 py-0.5 rounded border border-action-100/50 shrink-0 hover:bg-action-100 transition-colors cursor-pointer"
                            >
                              UPDATE
                            </button>
                          )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-subtle flex flex-wrap gap-2">
                      <button
                        className="flex-1 bg-canvas text-content-primary py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-action-subtle hover:text-action-hover transition-colors border border-transparent hover:border-action-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.id, ViewMode.CHART);
                        }}
                      >
                        Chart
                      </button>
                      <button
                        className="flex-1 bg-canvas text-content-primary py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-action-subtle hover:text-action-hover transition-colors border border-transparent hover:border-action-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.id, ViewMode.COURSE);
                        }}
                      >
                        Timeline
                      </button>
                      <button
                        className="flex-1 bg-canvas text-content-primary py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-action-subtle hover:text-action-hover transition-colors border border-transparent hover:border-action-100"
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
              showToast("Patient record deleted successfully", {
                type: "success",
              });
            } else if (statusConfirm.action === "DECEASED") {
              onUpdatePatientStatus(
                statusConfirm.id,
                PatientStatus.DECEASED,
                undefined,
                data.deceasedInfo,
              );
              showToast("Patient marked as deceased successfully", {
                type: "success",
              });
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
              showToast(message, { type: "success" });
            }
            setStatusConfirm(null);
          }
        }}
      />
    </>
  );
};

export default DashboardView;
