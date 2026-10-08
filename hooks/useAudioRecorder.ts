import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioRecorderOptions {
  onAudioReady: (audio: Blob) => void | Promise<void>;
  onError: (error: unknown) => void;
  enabled?: boolean;
}

export const useAudioRecorder = ({
  onAudioReady,
  onError,
  enabled = true,
}: UseAudioRecorderOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  const callbacksRef = useRef({ onAudioReady, onError });
  enabledRef.current = enabled;
  callbacksRef.current = { onAudioReady, onError };

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current || !enabledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        releaseStream();
        recorderRef.current = null;
        setIsRecording(false);
        if (mountedRef.current) {
          void callbacksRef.current.onAudioReady(
            new Blob(chunksRef.current, { type: "audio/webm" }),
          );
        }
        chunksRef.current = [];
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      releaseStream();
      recorderRef.current = null;
      setIsRecording(false);
      callbacksRef.current.onError(error);
    }
  }, [releaseStream]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  useEffect(() => {
    if (enabled) return;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
    setIsRecording(false);
  }, [enabled, releaseStream]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      recorderRef.current = null;
      chunksRef.current = [];
      releaseStream();
    };
  }, [releaseStream]);

  return { isRecording, startRecording, stopRecording };
};
