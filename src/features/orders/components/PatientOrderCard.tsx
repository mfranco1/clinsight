import React, { useState, useEffect } from "react";
import { OrderCategory, PatientOrder, OrderStatus } from "../../../types";
import { Icons } from "../../../components/ui/Icons";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import OrderStatusDropdown, {
  getStatusColor,
} from "../../../components/ui/OrderStatusDropdown";
import { getLocalDateString } from "../../../utils/date";
import ConfirmationModal from "../../../components/dialogs/ConfirmationModal";

interface PatientOrderCardProps {
  order: PatientOrder;
  onUpdate: (updatedOrder: PatientOrder) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
  onUngroup?: () => void;
  isOverlay?: boolean;
}

const PatientOrderCard: React.FC<PatientOrderCardProps> = ({
  order,
  onUpdate,
  onDelete,
  isNew = false,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
  onUngroup,
  isOverlay = false,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [editName, setEditName] = useState(order.name);
  const [editTargetDate, setEditTargetDate] = useState(order.targetDate);
  const [editStatus, setEditStatus] = useState<OrderStatus>(order.status);
  const [editCategory, setEditCategory] = useState<OrderCategory>(
    order.category || "Other",
  );
  const [editNotes, setEditNotes] = useState(order.notes);
  const [isNameExpanded, setIsNameExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, disabled: isOverlay });

  const style = isOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.4 : 1,
      };

  const formatForInput = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return getLocalDateString(isoString);
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      const hh = date.getHours().toString().padStart(2, "0");
      const mm = date.getMinutes().toString().padStart(2, "0");
      return `${y}-${m}-${d}T${hh}:${mm}`;
    } catch (e) {
      return getLocalDateString(isoString);
    }
  };

  const handleSave = () => {
    if (!editName.trim()) return;

    onUpdate({
      ...order,
      name: editName.trim(),
      targetDate: editTargetDate,
      status: editStatus,
      category: editCategory,
      notes: editNotes,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNew) {
      onDelete(order.id);
    } else {
      setEditName(order.name);
      setEditTargetDate(order.targetDate);
      setEditStatus(order.status);
      setEditCategory(order.category || "Other");
      setEditNotes(order.notes);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-surface border-2 border-action-500 rounded-2xl p-5 shadow-xl ring-4 ring-action-500/5 z-10 relative">
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.15em] ml-1">
                Order Name
              </label>
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. CBC, Chest X-Ray"
                className="w-full px-4 py-2.5 bg-canvas border border-border-default focus:bg-surface focus:border-action rounded-xl text-sm transition-all outline-none font-bold shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.15em] ml-1">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formatForInput(editTargetDate)}
                  onChange={(e) =>
                    setEditTargetDate(new Date(e.target.value).toISOString())
                  }
                  className="w-full px-4 py-2.5 bg-canvas border border-border-default focus:bg-surface focus:border-action rounded-xl text-xs transition-all outline-none shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.15em] ml-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(e.target.value as OrderCategory)
                    }
                    className="w-full px-4 py-2.5 bg-canvas border border-border-default focus:bg-surface focus:border-action rounded-xl text-xs transition-all outline-none appearance-none shadow-sm font-bold"
                  >
                    <option value="Lab">Lab</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Medication">Medication</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Blood">Blood</option>
                    <option value="Papers">Papers</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-muted">
                    <Icons.ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.15em] ml-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as OrderStatus)
                    }
                    className="w-full px-4 py-2.5 bg-canvas border border-border-default focus:bg-surface focus:border-action rounded-xl text-xs transition-all outline-none appearance-none shadow-sm font-bold"
                  >
                    {Object.values(OrderStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-muted">
                    <Icons.ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.15em] ml-1">
              Notes
            </label>
            <div className="bg-canvas border border-border-default rounded-xl p-3 focus-within:bg-surface focus-within:border-action-500 transition-all shadow-inner">
              <EditableTextArea
                value={editNotes}
                onChange={setEditNotes}
                isEditing={true}
                showControls={false}
                placeholder="Additional instructions or notes..."
                className="border-none p-0 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 text-xs font-bold text-content-secondary hover:text-neutral-800 hover:bg-surface-muted rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-action text-white rounded-xl text-xs font-bold hover:bg-action-hover transition-all shadow-lg shadow-action-600/20 active:scale-95"
            >
              {isNew ? "Add Order" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const targetDateObj = new Date(order.targetDate);
  const hasTime =
    targetDateObj.getHours() !== 0 || targetDateObj.getMinutes() !== 0;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`group bg-surface transition-all relative 
        ${isDragging ? "shadow-2xl ring-2 ring-action-500/20 z-50" : ""} 
        ${isGroupedWithPrev ? "border-t-0" : "border-t border-border-subtle first:border-t-0"}
        ${isGroupedWithNext ? "border-b-0" : "border-b border-border-subtle last:border-b-0"}
        ${isSelected ? "bg-action-subtle/50" : "hover:bg-canvas/50"}
      `}
      {...(isDesktop && !isSelectMode && !isOverlay
        ? { ...attributes, ...listeners }
        : {})}
    >
      {/* Grouping Connector Line */}
      {order.groupId && (
        <div className="absolute left-[50px] top-0 bottom-0 w-px bg-neutral-200 z-0">
          {isGroupedWithPrev && isGroupedWithNext && (
            <div className="absolute inset-0 bg-neutral-200"></div>
          )}
          {!isGroupedWithPrev && isGroupedWithNext && (
            <div className="absolute top-1/2 bottom-0 bg-neutral-200"></div>
          )}
          {isGroupedWithPrev && !isGroupedWithNext && (
            <div className="absolute top-0 bottom-1/2 bg-neutral-200"></div>
          )}
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-[120px_1.5fr_100px_120px_1fr_100px_100px] items-start md:items-center py-3 px-4 gap-3 md:gap-4 relative z-10">
        {/* Status Badge Dropdown / Selection Checkbox */}
        <div className="flex items-center justify-between w-full md:justify-center md:w-full relative border-b md:border-b-0 pb-2 md:pb-0 border-border-subtle">
          <div className="flex items-center gap-1.5 md:hidden">
            {!isSelectMode && (
              <div
                {...(!isDesktop && !isOverlay
                  ? { ...attributes, ...listeners }
                  : {})}
                className="p-1 -ml-1 text-neutral-300 hover:text-content-secondary cursor-grab active:cursor-grabbing"
              >
                <Icons.GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            {isSelectMode && (
              <button
                onClick={onToggleSelect}
                className={`p-1.5 -ml-1 rounded-lg transition-all flex items-center justify-center`}
              >
                {isSelected ? (
                  <div className="w-4 h-4 rounded-full bg-action-subtle border-2 border-action-500 flex items-center justify-center shadow-sm shadow-action-500/20">
                    {isSelected && (
                      <Icons.Check className="w-2.5 h-2.5 text-white" />
                    )}
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
              <OrderStatusDropdown
                status={order.status}
                onChange={(newStatus) =>
                  onUpdate({ ...order, status: newStatus })
                }
                isDesktop={isDesktop}
              />
            </div>
          </div>
        </div>

        {/* Order Name */}
        <div className="min-w-0 w-full md:w-full">
          <div className="flex items-start md:items-center gap-2">
            {order.groupId && (
              <div
                className={`shrink-0 w-4 h-4 md:w-5 md:h-5 rounded flex items-center justify-center bg-transparent mt-0.5 md:mt-0`}
                title="Grouped Order"
              >
                <Icons.Layers className={`w-3 h-3 text-content-muted`} />
              </div>
            )}
            <p
              onClick={() => setIsNameExpanded(!isNameExpanded)}
              title={order.name}
              className={`text-xs font-bold cursor-pointer transition-all ${
                isNameExpanded ? "whitespace-normal break-words" : "truncate"
              } ${order.status === OrderStatus.DONE ? "text-content-muted line-through" : "text-content-strong"}`}
            >
              {order.name}
            </p>
          </div>
          <div className="flex md:hidden items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-surface-muted text-[8px] font-black text-content-secondary uppercase tracking-tighter border border-border-default/50">
              {order.category || "Other"}
            </span>
            <div className="h-2 w-px bg-neutral-200"></div>
            <span className="text-[9px] font-bold text-content-muted">
              Ordered{" "}
              {new Date(order.dateOrdered).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="hidden md:flex items-center min-w-0">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black text-content-secondary bg-surface-muted uppercase tracking-wider border border-border-default/50 truncate">
            {order.category || "Other"}
          </span>
        </div>

        {/* Schedule */}
        <div className="w-full md:w-full min-w-0 flex items-center justify-between md:block py-1 md:py-0">
          <div className="flex md:hidden items-center gap-1.5 text-[9px] font-black text-content-muted uppercase tracking-tighter">
            <Icons.Calendar className="w-3 h-3" />
            Schedule
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0.5 min-w-0">
            <div className="flex items-center gap-1 text-[10px] md:text-[10px] font-mono font-black text-success-600 md:text-content-default bg-success-50 md:bg-transparent px-1.5 py-0.5 md:p-0 rounded md:rounded-none truncate">
              <Icons.Clock className="w-3 h-3 text-success-500 md:text-content-muted shrink-0" />
              {hasTime
                ? targetDateObj.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "---"}
            </div>
            <div className="text-[9px] font-bold text-content-secondary md:text-content-muted uppercase tracking-tighter truncate">
              {targetDateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Notes Snippet */}
        <div className="w-full md:w-full min-w-0 py-1 md:py-0 border-t border-neutral-50 md:border-none">
          {order.notes ? (
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
                  title={order.notes}
                  className="text-[10px] md:text-[11px] text-content-secondary italic leading-tight cursor-pointer transition-all hover:text-action line-clamp-1"
                >
                  "{order.notes}"
                </p>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-neutral-300 italic">
              No notes
            </span>
          )}
        </div>

        {/* Mobile Expanded Note Detail - High visibility for mobile */}
        {isNotesExpanded && order.notes && (
          <div className="md:hidden w-full pb-3 pt-1">
            <div className="bg-surface border border-border-default rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-action-subtle/50"></div>
              <div className="text-xs text-content-primary leading-relaxed font-medium">
                <ClinicalMarkdown content={order.notes} />
              </div>
            </div>
          </div>
        )}

        {/* Ordered Date */}
        <div className="hidden md:flex flex-col items-start min-w-0">
          <span className="text-[9px] font-bold text-content-muted uppercase tracking-wider truncate">
            Ordered
          </span>
          <div className="text-[10px] font-bold text-content-secondary uppercase tracking-tighter truncate">
            {new Date(order.dateOrdered).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end md:justify-start gap-1 transition-opacity w-full md:w-full mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle shrink-0">
          {order.groupId && (
            <button
              onClick={onUngroup}
              className="p-2 text-content-muted hover:text-warning-600 hover:bg-warning-50 rounded-xl transition-all"
              title="Remove from Group"
            >
              <Icons.Layers className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-content-muted hover:text-action hover:bg-transparent rounded-xl transition-all"
            title="Edit Order"
          >
            <Icons.Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-content-muted hover:text-critical-600 hover:bg-transparent rounded-xl transition-all"
            title="Delete Order"
          >
            <Icons.Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Note Detail - Desktop version */}
      {isNotesExpanded && order.notes && (
        <div className="hidden md:block px-4 pb-4 pt-0 overflow-hidden">
          <div className="ml-12 bg-surface border border-border-default rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-action-subtle/50"></div>
            <div className="flex items-start gap-3">
              <div className="text-xs text-content-primary leading-relaxed font-medium">
                <ClinicalMarkdown content={order.notes} />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(order.id)}
        title="Delete Order?"
        message={`Are you sure you want to delete "${order.name || "this order"}"? This action cannot be undone.`}
        confirmLabel="Delete Order"
        variant="danger"
      />
    </div>
  );
};

export default PatientOrderCard;
