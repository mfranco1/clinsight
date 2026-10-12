import React, { useState } from "react";
import { Icons } from "../../../components/ui/Icons";
import { transcribeAudio } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import ModalShell from "../../../components/ui/ModalShell";
import { ErrorState } from "../../../components/ui/LoadingFeedback";

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
      } catch (error) {
        logDiagnostic("error", "Smart-append transcription failed.");
        setError("Could not transcribe audio. Please try recording again.");
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
      logDiagnostic("error", "Smart-append integration failed.");
    } finally {
      setIsIntegrating(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onCancel}
      title={`Adding to ${sectionTitle}`}
      icon={Icons.Edit}
      size="2xl"
      placement="bottom"
      closeOnInteractOutside={false}
      closeOnEscape={false}
      overlayClassName="bg-neutral-900/40"
      className="ring-4 ring-action-500/20"
      bodyClassName="space-y-4 p-6"
      footerActions={
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isIntegrating || isTranscribing}
            className={`mr-auto flex items-center rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${isRecording ? "animate-pulse border border-danger-200 bg-danger-50 text-danger-600 shadow-inner" : "border border-border-default bg-canvas text-content-default hover:bg-action-subtle hover:text-action"}`}
          >
            {isRecording ? (
              <>
                <span className="mr-2 h-2 w-2 rounded-full bg-danger-600" />
                Stop Dictating
              </>
            ) : (
              <>
                <Icons.Microphone className="mr-2 h-4 w-4" />
                Dictate
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isIntegrating}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-content-muted hover:text-content-default"
          >
            Cancel
          </button>
          <button
            onClick={handleIntegrate}
            disabled={!userInput.trim() || isIntegrating || isTranscribing}
            className={`rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 ${!userInput.trim() || isIntegrating || isTranscribing ? "cursor-not-allowed bg-neutral-200 text-content-muted shadow-none" : "bg-action text-white shadow-action-600/20 hover:bg-action-hover"}`}
          >
            {isIntegrating ? "Integrating..." : "Merge into Chart"}
          </button>
        </>
      }
    >
      <div className="max-h-20 overflow-y-auto pr-2 custom-scrollbar">
        {suggestions.length === 1 ? (
          <p className="text-sm font-bold text-content-strong">
            {suggestions[0]}
          </p>
        ) : (
          <ul className="list-disc pl-4">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${index}-${suggestion}`}
                className="mb-1 text-xs font-bold leading-tight text-neutral-800"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative">
        {error && (
          <ErrorState
            variant="inline"
            title="Dictation unavailable"
            message={error}
            action={
              <button
                type="button"
                className="underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            }
            className="mb-3"
          />
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
          className="bg-canvas text-sm leading-relaxed text-neutral-800"
        />

        {isTranscribing && (
          <div className="absolute inset-0 flex animate-fade-in items-center justify-center rounded-xl bg-surface/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface px-4 py-2 shadow-lg">
              <Icons.Loader className="h-5 w-5 text-action" />
              <span className="text-sm font-bold text-content-primary">
                Verifying voice input...
              </span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default SmartAppendOverlay;
