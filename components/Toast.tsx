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
      bg: "bg-red-50",
      border: "border-red-500",
      text: "text-red-700",
      icon: <Icons.Alert className="h-5 w-5 text-red-400" />,
      close: "text-red-400 hover:text-red-500 focus:ring-red-500",
    },
    success: {
      bg: "bg-teal-50",
      border: "border-teal-500",
      text: "text-teal-700",
      icon: <Icons.Check className="h-5 w-5 text-teal-400" />,
      close: "text-teal-400 hover:text-teal-500 focus:ring-teal-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      text: "text-blue-700",
      icon: <Icons.Info className="h-5 w-5 text-blue-400" />,
      close: "text-blue-400 hover:text-blue-500 focus:ring-blue-500",
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
