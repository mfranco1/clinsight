import React, { useState } from "react";
import { MedicationOrder, MedicationStatus } from "../../../types";
import { Icons } from "../../../components/ui/Icons";
import MedicationStatusDropdown from "../../../components/ui/MedicationStatusDropdown";
import ConfirmationModal from "../../../components/dialogs/ConfirmationModal";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import Badge from "../../../components/ui/Badge";
import TextArea from "../../../components/ui/TextArea";
import { motion } from "motion/react";

interface MedicationOrderRowProps {
  med: MedicationOrder;
  onUpdate: (updatedMed: MedicationOrder) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const MedicationOrderRow: React.FC<MedicationOrderRowProps> = ({
  med,
  onUpdate,
  onDelete,
  isNew = false,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [isNameExpanded, setIsNameExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [editDrug, setEditDrug] = useState(med.drug);
  const [editDose, setEditDose] = useState(med.dose);
  const [editRoute, setEditRoute] = useState(med.route);
  const [editFrequency, setEditFrequency] = useState(med.frequency);
  const [editDuration, setEditDuration] = useState(med.duration);
  const [editStatus, setEditStatus] = useState<MedicationStatus>(med.status);
  const [editNotes, setEditNotes] = useState(med.notes || "");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  React.useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const handleSave = () => {
    if (!editDrug.trim()) return;
    onUpdate({
      ...med,
      drug: editDrug.trim(),
      dose: editDose,
      route: editRoute,
      frequency: editFrequency,
      duration: editDuration,
      status: editStatus,
      notes: editNotes,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNew) {
      onDelete(med.id);
    } else {
      setEditDrug(med.drug);
      setEditDose(med.dose);
      setEditRoute(med.route);
      setEditFrequency(med.frequency);
      setEditDuration(med.duration);
      setEditStatus(med.status);
      setEditNotes(med.notes || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-surface border-2 border-action-500 rounded-2xl p-5 shadow-xl z-20 relative my-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Medication Name
            </label>
            <input
              autoFocus
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none"
              value={editDrug}
              onChange={(e) => setEditDrug(e.target.value)}
              placeholder="e.g. Ceftriaxone"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) =>
                setEditStatus(e.target.value as MedicationStatus)
              }
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none appearance-none"
            >
              {Object.values(MedicationStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Dose
            </label>
            <input
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none"
              value={editDose}
              onChange={(e) => setEditDose(e.target.value)}
              placeholder="e.g. 2g"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Route
            </label>
            <input
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none"
              value={editRoute}
              onChange={(e) => setEditRoute(e.target.value)}
              placeholder="e.g. IV"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Frequency
            </label>
            <input
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none"
              value={editFrequency}
              onChange={(e) => setEditFrequency(e.target.value)}
              placeholder="e.g. OD"
            />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
              Duration
            </label>
            <input
              className="w-full px-3 py-2 bg-canvas border border-border-default rounded-xl text-sm font-bold focus:bg-surface focus:border-action outline-none"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              placeholder="e.g. 7 days"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-[10px] font-black text-content-muted uppercase tracking-widest ml-1">
            Notes
          </label>
          <TextArea
            variant="subtle"
            className="min-h-[60px] font-medium"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Sig or other notes..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold text-content-secondary hover:text-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-action text-white rounded-xl text-xs font-bold hover:bg-action-hover shadow-lg shadow-action-600/20 active:scale-95 transition-all"
          >
            {isNew ? "Add Medication" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group bg-surface transition-all border-b border-border-subtle last:border-b-0 ${isSelected ? "bg-action-subtle/50" : "hover:bg-canvas/50"}`}
    >
      <div className="flex flex-col md:grid md:grid-cols-[120px_1.5fr_80px_120px_120px_100px_1fr_100px] items-start md:items-center py-3 px-4 gap-3 md:gap-4 relative">
        {/* Status */}
        <div className="flex items-center justify-between w-full md:justify-center md:w-full relative border-b md:border-b-0 pb-2 md:pb-0 border-border-subtle">
          <div className="flex items-center gap-1.5 md:hidden">
            {isSelectMode && (
              <button
                onClick={onToggleSelect}
                className={`p-1.5 -ml-1 rounded-lg transition-all flex items-center justify-center`}
              >
                {isSelected ? (
                  <div className="w-4 h-4 rounded-full bg-action-subtle border-2 border-action-500 flex items-center justify-center shadow-sm shadow-action-500/20">
                    <Icons.Check className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border-default bg-surface" />
                )}
              </button>
            )}
            <span className="text-[9px] font-black text-content-muted uppercase tracking-widest">
              Status
            </span>
          </div>

          <div className="relative flex items-center gap-3">
            {isSelectMode && (
              <button
                onClick={onToggleSelect}
                className={`hidden md:flex p-1.5 rounded-lg transition-all items-center justify-center underline-none group/sel shrink-0`}
              >
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-action-subtle border-2 border-action-500 flex items-center justify-center shadow-sm shadow-action-500/20">
                    <Icons.Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border-default bg-surface group-hover/sel:border-action-300 transition-colors" />
                )}
              </button>
            )}
            <div className="shrink-0">
              <MedicationStatusDropdown
                status={med.status}
                onChange={(s) => onUpdate({ ...med, status: s })}
                isDesktop={isDesktop}
              />
            </div>
          </div>
        </div>

        {/* Drug */}
        <div className="w-full md:w-full min-w-0 py-1 md:py-0">
          <p
            onClick={() => setIsNameExpanded(!isNameExpanded)}
            title={med.drug}
            className={`text-xs md:text-xs font-bold cursor-pointer transition-all ${
              isNameExpanded ? "whitespace-normal break-words" : "truncate"
            } ${med.status === MedicationStatus.DISCONTINUED || med.status === MedicationStatus.COMPLETED ? "text-content-muted line-through" : "text-content-strong"}`}
          >
            {med.drug || "Undefined Medication"}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 md:hidden">
            <span className="px-1.5 py-0.5 rounded bg-action-subtle text-[9px] font-black text-action-hover uppercase tracking-tight border border-action-100">
              {med.dose || "No Dose"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-muted text-[9px] font-black text-content-secondary uppercase tracking-widest border border-border-default/50">
              {med.route || "No Route"}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-bold text-content-muted bg-canvas px-1.5 py-0.5 rounded border border-border-subtle whitespace-nowrap">
              <Icons.Clock className="w-2.5 h-2.5" />
              {med.frequency || "No Frequency"}
            </div>
            {med.duration && (
              <span className="text-[9px] font-bold text-content-muted italic">
                • {med.duration}
              </span>
            )}
          </div>
        </div>

        {/* Dose */}
        <div className="hidden md:flex items-center min-w-0 overflow-hidden w-full">
          <span
            className="text-[11px] font-bold text-content-default truncate"
            title={med.dose}
          >
            {med.dose || "—"}
          </span>
        </div>

        {/* Route */}
        <div className="hidden md:flex items-center min-w-0 overflow-hidden w-full">
          <Badge
            tone="neutral"
            size="sm"
            className="max-w-full truncate border border-border-default/50 font-black uppercase tracking-widest text-content-secondary"
            title={med.route}
          >
            {med.route || "—"}
          </Badge>
        </div>

        {/* Frequency */}
        <div className="hidden md:flex items-center min-w-0 overflow-hidden w-full">
          <span
            className="text-[11px] font-bold text-content-default uppercase tracking-tight truncate"
            title={med.frequency}
          >
            {med.frequency || "—"}
          </span>
        </div>

        {/* Duration */}
        <div className="hidden md:flex items-center min-w-0 overflow-hidden w-full">
          <span
            className="text-[11px] font-bold text-content-secondary italic truncate"
            title={med.duration}
          >
            {med.duration || "—"}
          </span>
        </div>

        {/* Notes */}
        <div className="w-full md:w-full min-w-0 py-1 md:py-0 border-t md:border-none border-neutral-50 mt-1 md:mt-0">
          {med.notes ? (
            <div className="relative group/note">
              {isNotesExpanded ? (
                <div
                  className="text-[10px] md:text-[11px] text-action font-bold flex items-center gap-1 cursor-pointer hover:text-action-hover transition-colors"
                  onClick={() => setIsNotesExpanded(false)}
                >
                  <Icons.ChevronUp className="w-3 h-3" />
                  Close Note
                </div>
              ) : (
                <p
                  onClick={() => setIsNotesExpanded(true)}
                  className="text-[10px] md:text-[11px] text-content-secondary italic leading-tight cursor-pointer transition-all hover:text-action truncate"
                  title={med.notes}
                >
                  "{med.notes}"
                </p>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-neutral-300 italic">
              No notes
            </span>
          )}
        </div>

        {/* Mobile Expanded Note Detail */}
        {isNotesExpanded && med.notes && (
          <div className="md:hidden w-full pb-3 pt-1">
            <div className="bg-surface border border-border-default rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-action-subtle/50"></div>
              <div className="text-xs text-content-primary leading-relaxed font-medium">
                <ClinicalMarkdown content={med.notes} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 w-full md:w-full mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-content-muted hover:text-action transition-colors"
            title="Edit"
          >
            <Icons.Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-content-muted hover:text-critical-600 transition-colors"
            title="Delete"
          >
            <Icons.Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Note Detail - Desktop version */}
      {isNotesExpanded && med.notes && (
        <div className="hidden md:block px-4 pb-4 pt-0 overflow-hidden">
          <div className="ml-12 bg-surface border border-border-default rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-action-subtle/50"></div>
            <div className="flex items-start gap-3">
              <div className="text-xs text-content-primary leading-relaxed font-medium">
                <ClinicalMarkdown content={med.notes} />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(med.id)}
        title="Remove Medication?"
        message={`Are you sure you want to remove ${med.drug || "this medication"} from the active plan?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
};

export default MedicationOrderRow;
