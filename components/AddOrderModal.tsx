import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { OrderCategory, PatientOrder, OrderStatus } from "../types";
import { Icons } from "./ui/Icons";
import EditableTextArea from "./ui/EditableTextArea";
import { createId } from "../utils/ids";

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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border-2 border-teal-500 rounded-2xl p-5 shadow-xl ring-4 ring-teal-500/5 z-10 relative max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Add Order</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                Order Name
              </label>
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. CBC, Chest X-Ray"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-xl text-sm transition-all outline-none font-bold shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formatForInput(editTargetDate)}
                  onChange={(e) =>
                    setEditTargetDate(new Date(e.target.value).toISOString())
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-xl text-xs transition-all outline-none shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(e.target.value as OrderCategory)
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-xl text-xs transition-all outline-none appearance-none shadow-sm font-bold"
                  >
                    <option value="Lab">Lab</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Medication">Medication</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Blood">Blood</option>
                    <option value="Papers">Papers</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Icons.ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as OrderStatus)
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-xl text-xs transition-all outline-none appearance-none shadow-sm font-bold"
                  >
                    {Object.values(OrderStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Icons.ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
              Notes
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:bg-white focus-within:border-teal-500 transition-all shadow-inner">
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95"
            >
              Add Order
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddOrderModal;
