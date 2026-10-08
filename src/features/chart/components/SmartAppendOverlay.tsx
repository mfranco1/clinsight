import React, { useState } from "react";
import { Icons } from "../../../components/ui/Icons";
import { transcribeAudio } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import EditableTextArea from "../../../components/ui/EditableTextArea";

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center sm:p-6 bg-neutral-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden ring-4 ring-action-500/20 animate-fade-in-up">
        <div className="px-6 py-4 bg-canvas border-b border-border-default flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-action-100 p-1.5 rounded-lg mr-3 text-action">
              <Icons.Edit />
            </div>
            <div>
              <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest">
                Adding to {sectionTitle}
              </h3>
              <div className="max-h-20 overflow-y-auto custom-scrollbar pr-2 mt-0.5">
                {suggestions.length === 1 ? (
                  <p className="text-sm font-bold text-content-strong">
                    {suggestions[0]}
                  </p>
                ) : (
                  <ul className="list-disc pl-4">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs font-bold text-neutral-800 leading-tight mb-1"
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
            className="text-content-muted hover:text-content-default transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        <div className="p-6 relative">
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700"
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
          <EditableTextArea
            value={userInput}
            onChange={setUserInput}
            disabled={isIntegrating || isTranscribing}
            placeholder="Type or dictate the response here..."
            isEditing={true}
            showControls={false}
            autoFocus={true}
            editorMode="source"
            minHeight="min-h-[160px]"
            className="bg-canvas text-neutral-800 text-sm leading-relaxed"
          />

          {isTranscribing && (
            <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center rounded-xl animate-fade-in">
              <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-full shadow-lg border border-border-subtle">
                <Icons.Loader className="h-5 w-5 text-action" />
                <span className="text-sm font-bold text-content-primary">
                  Verifying voice input...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isIntegrating || isTranscribing}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isRecording ? "bg-danger-50 text-danger-600 animate-pulse border border-danger-200 shadow-inner" : "bg-canvas text-content-default hover:bg-action-subtle hover:text-action border border-border-default"}`}
            >
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-danger-600 mr-2"></span>
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
              className="px-4 py-2 text-xs font-bold text-content-muted hover:text-content-default uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleIntegrate}
              disabled={!userInput.trim() || isIntegrating || isTranscribing}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${!userInput.trim() || isIntegrating || isTranscribing ? "bg-neutral-200 text-content-muted cursor-not-allowed shadow-none" : "bg-action text-white hover:bg-action-hover shadow-action-600/20"}`}
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
