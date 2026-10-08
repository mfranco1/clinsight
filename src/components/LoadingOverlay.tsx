import React from "react";
import { Icons } from "./ui/Icons";

interface LoadingOverlayProps {
  onCancel?: () => void;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  onCancel,
  message = "Preparing clinical summary…",
}) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/35 backdrop-blur-[2px] animate-fade-in"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-[3px] border-white/50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-white border-t-transparent motion-reduce:animate-none"
        />
        <Icons.Logo className="h-8 w-8 text-white" />
      </div>
      <p className="mb-6 text-sm font-medium text-white">{message}</p>

      {onCancel && (
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-control border border-white/50 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Icons.Close className="mr-2 h-4 w-4" />
          Cancel
        </button>
      )}
    </div>
  </div>
);

export default LoadingOverlay;
