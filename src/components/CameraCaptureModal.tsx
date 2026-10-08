import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icons } from "./ui/Icons";
import { useCameraCapture } from "../hooks/useCameraCapture";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    stream,
    error,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startCamera,
  } = useCameraCapture(isOpen);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File(
                [blob],
                `camera-capture-${Date.now()}.jpg`,
                { type: "image/jpeg" },
              );
              onCapture(file);
              onClose();
            }
          },
          "image/jpeg",
          0.9,
        );
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full border border-border-default flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-canvas/50">
          <div className="flex items-center">
            <div className="p-2 bg-action-100 rounded-lg mr-3 text-action-hover">
              <Icons.Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-strong">
                Capture Attachment
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-default p-1 rounded-full hover:bg-neutral-200 transition-colors"
          >
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-white text-center p-6">
              <Icons.Alert className="w-12 h-12 text-danger-500 mx-auto mb-4" />
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-surface text-content-strong rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-canvas border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-surface border border-border-default text-xs font-bold text-content-default rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-focus-ring"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    Camera {idx + 1}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-xs font-bold text-content-secondary hover:text-content-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              disabled={!!error || !stream}
              className="px-6 py-2.5 bg-action text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-action-hover shadow-lg shadow-action-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              <Icons.Camera className="w-4 h-4" />
              Capture Photo
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CameraCaptureModal;
