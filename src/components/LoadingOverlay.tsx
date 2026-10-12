import BrandMark from "./brand/BrandMark";
import React from "react";
import { Icons } from "./ui/Icons";
import { LoadingBar } from "./ui/LoadingFeedback";

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
      <BrandMark size={32} colorMode="mono" className="mb-5 text-white" />
      <p className="mb-3 text-sm font-medium text-white">{message}</p>
      <div className="mb-6">
        <LoadingBar tone="inverse" />
      </div>

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
