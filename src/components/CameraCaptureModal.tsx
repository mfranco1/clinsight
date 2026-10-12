import { useRef, useEffect } from "react";
import { Icons } from "./ui/Icons";
import { useCameraCapture } from "../hooks/useCameraCapture";
import ModalShell from "./ui/ModalShell";

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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Capture Attachment"
      icon={Icons.Camera}
      size="2xl"
      closeOnInteractOutside={false}
      closeOnEscape={false}
      overlayClassName="bg-neutral-900/80 animate-fade-in"
      className="max-h-[90dvh]"
      bodyClassName="flex flex-col overflow-hidden p-0"
    >
      <div className="relative flex min-h-[300px] flex-1 items-center justify-center bg-black">
        {error ? (
          <div role="alert" className="text-white text-center p-6">
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
      <div className="flex flex-col items-center justify-between gap-4 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          {devices.length > 1 && (
            <select
              aria-label="Camera device"
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
    </ModalShell>
  );
};

export default CameraCaptureModal;
