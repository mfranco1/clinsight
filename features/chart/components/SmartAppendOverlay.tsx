import React, { useState, useRef, useEffect } from "react";
import { Icons } from "../../../components/ui/Icons";
import { transcribeAudio } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";

interface SmartAppendOverlayProps {
  suggestions: string[];
  sectionTitle: string;
  onCancel: () => void;
  onIntegrate: (userInput: string) => Promise<void>;
}

const SmartAppendOverlay: React.FC<SmartAppendOverlayProps> = ({
  suggestions,
  sectionTitle,
  onCancel,
  onIntegrate,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioReady: async (audioBlob) => {
      setIsTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        if (transcription)
          setUserInput((prev) =>
            prev ? `${prev} ${transcription}` : transcription,
          );
      } finally {
        setIsTranscribing(false);
      }
    },
    onError: () => setError("Microphone access required for dictation."),
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleIntegrate = async () => {
    if (!userInput.trim() || isIntegrating) return;
    setIsIntegrating(true);
    try {
      await onIntegrate(userInput);
    } catch (error) {
      logDiagnostic("error", "Smart-append transcription failed.");
    } finally {
      setIsIntegrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ring-4 ring-teal-500/20 animate-fade-in-up">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-teal-100 p-1.5 rounded-lg mr-3 text-teal-600">
              <Icons.Edit />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Adding to {sectionTitle}
              </h3>
              <div className="max-h-20 overflow-y-auto custom-scrollbar pr-2 mt-0.5">
                {suggestions.length === 1 ? (
                  <p className="text-sm font-bold text-slate-900">
                    {suggestions[0]}
                  </p>
                ) : (
                  <ul className="list-disc pl-4">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs font-bold text-slate-800 leading-tight mb-1"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        <div className="p-6 relative">
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {error}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isIntegrating || isTranscribing}
            className="w-full h-40 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none text-slate-800 text-sm leading-relaxed transition-all placeholder-slate-400"
            placeholder="Type or dictate the response here..."
          />

          {isTranscribing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl animate-fade-in">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100">
                <Icons.Loader className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-bold text-slate-700">
                  Verifying voice input...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isIntegrating || isTranscribing}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isRecording ? "bg-red-50 text-red-600 animate-pulse border border-red-200 shadow-inner" : "bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600 border border-slate-200"}`}
            >
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                  Stop Dictating
                </>
              ) : (
                <>
                  <Icons.Microphone className="w-4 h-4 mr-2" />
                  Dictate
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isIntegrating}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleIntegrate}
              disabled={!userInput.trim() || isIntegrating || isTranscribing}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${!userInput.trim() || isIntegrating || isTranscribing ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/20"}`}
            >
              {isIntegrating ? "Integrating..." : "Merge into Chart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAppendOverlay;
