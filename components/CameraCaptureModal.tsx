
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './ui/Icons';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
      enumerateDevices();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, selectedDeviceId]);

  const enumerateDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: 'environment' }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you have granted permission.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg mr-3 text-teal-700">
              <Icons.Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Capture Attachment</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-white text-center p-6">
              <Icons.Alert className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={startCamera} className="mt-4 px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider">Retry</button>
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {devices.length > 1 && (
              <select 
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
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
              className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={captureImage}
              disabled={!!error || !stream}
              className="px-6 py-2.5 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              <Icons.Camera className="w-4 h-4" />
              Capture Photo
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CameraCaptureModal;
