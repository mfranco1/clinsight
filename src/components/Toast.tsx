import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icons } from "./ui/Icons";

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: "error" | "success" | "info";
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  type = "error",
  duration = 5000,
}) => {
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    error: {
      bg: "bg-danger-50",
      border: "border-danger-500",
      text: "text-danger-700",
      icon: <Icons.Alert className="h-5 w-5 text-danger-400" />,
      close: "text-danger-400 hover:text-danger-500 focus:ring-danger-500",
    },
    success: {
      bg: "bg-action-subtle",
      border: "border-action-500",
      text: "text-action-hover",
      icon: <Icons.Check className="h-5 w-5 text-action-400" />,
      close: "text-action-400 hover:text-action-500 focus:ring-focus-ring",
    },
    info: {
      bg: "bg-info-50",
      border: "border-info-500",
      text: "text-info-700",
      icon: <Icons.Info className="h-5 w-5 text-info-400" />,
      close: "text-info-400 hover:text-info-500 focus:ring-info-500",
    },
  };

  const currentStyle = styles[type];

  return createPortal(
    <div
      className={`fixed bottom-24 right-4 z-[100] max-w-md w-full ${currentStyle.bg} border-l-4 ${currentStyle.border} p-4 rounded shadow-lg animate-slide-up-fade flex items-start`}
    >
      <div className="flex-shrink-0">{currentStyle.icon}</div>
      <div className="ml-3 flex-1 overflow-hidden">
        <p className={`text-sm ${currentStyle.text} break-words font-medium`}>
          {message}
        </p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          onClick={onClose}
          className={`bg-transparent rounded-md inline-flex ${currentStyle.close} focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          <span className="sr-only">Close</span>
          <Icons.Close className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Toast;
