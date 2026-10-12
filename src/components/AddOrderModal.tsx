import React, { useState, useEffect } from "react";
import { OrderCategory, PatientOrder, OrderStatus } from "../types";
import { Icons } from "./ui/Icons";
import EditableTextArea from "./ui/EditableTextArea";
import { createId } from "../utils/ids";
import ModalShell from "./ui/ModalShell";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: PatientOrder) => void;
  initialOrderName: string;
  sourceText?: string;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onAddOrder,
  initialOrderName,
  sourceText,
}) => {
  const [editName, setEditName] = useState(initialOrderName);
  const [editTargetDate, setEditTargetDate] = useState(
    new Date().toISOString(),
  );
  const [editStatus, setEditStatus] = useState<OrderStatus>(
    OrderStatus.PENDING,
  );
  const [editCategory, setEditCategory] = useState<OrderCategory>("Lab");
  const [editNotes, setEditNotes] = useState("");

  // Sync editName with initialOrderName prop when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setEditName(initialOrderName);
      setEditTargetDate(new Date().toISOString());
      setEditStatus(OrderStatus.PENDING);
      setEditCategory("Lab");
      setEditNotes("");
    }
  }, [isOpen, initialOrderName]);

  if (!isOpen) return null;

  const formatForInput = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      const hh = date.getHours().toString().padStart(2, "0");
      const mm = date.getMinutes().toString().padStart(2, "0");
      return `${y}-${m}-${d}T${hh}:${mm}`;
    } catch (e) {
      return "";
    }
  };

  const handleSave = () => {
    if (!editName.trim()) return;

    const newOrder: PatientOrder = {
      id: createId("order"),
      name: editName.trim(),
      dateOrdered: new Date().toISOString(),
      targetDate: editTargetDate,
      status: editStatus,
      category: editCategory,
      notes: editNotes,
      sourceText: sourceText,
    };

    onAddOrder(newOrder);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Add Order"
      size="4xl"
      closeOnInteractOutside={false}
      closeOnEscape={false}
      bodyClassName="p-5"
      className="border-2 border-action-500 ring-4 ring-action-500/5"
    >
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
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
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
              editorMode="source"
              className="border-none p-0 bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-content-secondary hover:text-neutral-800 hover:bg-surface-muted rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-action text-white rounded-xl text-xs font-bold hover:bg-action-hover transition-all shadow-lg shadow-action-600/20 active:scale-95"
          >
            Add Order
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default AddOrderModal;
