import React from "react";
import * as Icons from "lucide-react";
import ModalShell from "../ModalShell";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  icon?: React.ElementType;
  isConfirmDisabled?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  icon: IconOverride,
  isConfirmDisabled = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          iconColor: "text-amber-600",
          buttonBg: "bg-amber-600 hover:bg-amber-700",
          defaultIcon: Icons.AlertTriangle,
        };
      case "info":
        return {
          iconColor: "text-teal-600",
          buttonBg: "bg-teal-600 hover:bg-teal-700",
          defaultIcon: Icons.Info,
        };
      case "danger":
      default:
        return {
          iconColor: "text-rose-600",
          buttonBg: "bg-rose-600 hover:bg-rose-700",
          defaultIcon: Icons.Trash2,
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = IconOverride || styles.defaultIcon;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      ariaLabel={title}
      bodyClassName="p-6"
    >
      <div className={`flex items-center mb-4 ${styles.iconColor}`}>
        <div className="p-2 bg-transparent rounded-lg mr-3">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="text-slate-600 mb-6 text-sm leading-relaxed">
        {typeof message === "string" ? <p>{message}</p> : message}
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition-all"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            if (!isConfirmDisabled) {
              onConfirm();
              onClose();
            }
          }}
          disabled={isConfirmDisabled}
          className={`px-4 py-2 ${isConfirmDisabled ? "bg-slate-200 text-slate-400 cursor-not-allowed" : styles.buttonBg + " text-white active:scale-95"} font-bold text-xs rounded-xl shadow-sm transition-all`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};

export default ConfirmationModal;
