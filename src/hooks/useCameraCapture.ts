import { useCallback, useEffect, useRef, useState } from "react";

export const useCameraCapture = (isOpen: boolean) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: "environment" },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (requestId !== requestIdRef.current || !isOpenRef.current) {
        newStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = newStream;
      setStream(newStream);
    } catch (cameraError) {
      if (requestId !== requestIdRef.current || !isOpenRef.current) return;
      console.error("Error accessing camera:", cameraError);
      setError(
        "Could not access camera. Please ensure you have granted permission.",
      );
    }
  }, [selectedDeviceId]);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(
        (device) => device.kind === "videoinput",
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (deviceError) {
      console.error("Error enumerating devices:", deviceError);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (isOpen) {
      void startCamera();
      void enumerateDevices();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isOpen, selectedDeviceId, startCamera, enumerateDevices, stopCamera]);

  return {
    stream,
    error,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startCamera,
  };
};
