import React from "react";
import * as Icons from "lucide-react";
import ModalShell from "../ui/ModalShell";
import Button from "../ui/Button";

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
          iconColor: "text-warning-600",
          defaultIcon: Icons.AlertTriangle,
        };
      case "info":
        return {
          iconColor: "text-action",
          defaultIcon: Icons.Info,
        };
      case "danger":
      default:
        return {
          iconColor: "text-critical-600",
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
      <div className="text-content-default mb-6 text-sm leading-relaxed">
        {typeof message === "string" ? <p>{message}</p> : message}
      </div>
      <div className="flex justify-end space-x-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={
            isConfirmDisabled
              ? "secondary"
              : variant === "warning"
                ? "warning"
                : variant === "info"
                  ? "info"
                  : "danger"
          }
          size="sm"
          onClick={() => {
            if (!isConfirmDisabled) {
              onConfirm();
              onClose();
            }
          }}
          disabled={isConfirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
};

export default ConfirmationModal;
