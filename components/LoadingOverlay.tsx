import React, { useEffect, useState } from "react";

interface LoadingOverlayProps {
  onCancel?: () => void;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  onCancel,
  message,
}) => {
  const defaultMessages = [
    "Reading documents...",
    "Analyzing vitals and labs...",
    "Consulting clinical guidelines...",
    "Formulating management plan...",
    "Structuring SOAP note...",
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % defaultMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [message, defaultMessages.length]);

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center transform transition-all scale-100">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Processing Case
        </h3>
        <p className="text-sm text-slate-500 h-5 transition-opacity duration-300 mb-8">
          {message || defaultMessages[messageIndex]}
        </p>

        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-full text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors w-full sm:w-auto"
          >
            <svg
              className="w-4 h-4 mr-2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
