import React, { useState, useRef, useEffect } from "react";
import { medicalLookup } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { getErrorMessageCompat } from "../../../services/appErrors";

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";
import { GroundingSource } from "../../../types";
import { sendNotification } from "../../../services/notificationService";
import { Icons } from "../../../components/ui/Icons";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import ModalShell from "../../../components/ui/ModalShell";
import TextInput from "../../../components/ui/TextInput";
import Button from "../../../components/ui/Button";

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LookupModal: React.FC<LookupModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lookupRequestId = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const requestId = Date.now();
    lookupRequestId.current = requestId;

    setIsLoading(true);
    setResult(null);
    setSources([]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 60000);

    try {
      const response = await medicalLookup(query, abortController.signal);
      if (lookupRequestId.current === requestId) {
        setResult(response.text);
        if (response.groundingSources) {
          setSources(response.groundingSources);
        }

        // Send notification if modal is closed or tab is hidden
        if (!isOpen || document.visibilityState === "hidden") {
          sendNotification("Lookup Result Ready", {
            body: `Search for "${query}" is complete.`,
            tag: "lookup-result",
          });
        }
      }
    } catch (error: unknown) {
      if (lookupRequestId.current === requestId) {
        if (isAbortError(error)) {
          setResult("Search timed out after 60 seconds. Please try again.");
        } else {
          logDiagnostic("error", "Medical lookup failed.");
          setResult(
            "I'm sorry, I encountered an error during the lookup. Please try again.",
          );
        }
      }
    } finally {
      clearTimeout(timeoutId);
      if (lookupRequestId.current === requestId) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    lookupRequestId.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setResult(null);
    setSources([]);
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Lookup"
      icon={Icons.Search}
      iconBgColor="bg-action-100 text-action-hover"
      size="3xl"
      bodyClassName="flex flex-col overflow-hidden"
      footerActions={
        <button
          onClick={onClose}
          className="text-xs font-bold text-content-secondary hover:text-content-primary transition-colors"
        >
          Close
        </button>
      }
    >
      {/* Search Bar */}
      <div className="px-6 py-5 border-b border-neutral-50 flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-3">
          <TextInput
            variant="subtle"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about diagnostic criteria, drug dosages, indications..."
            className="flex-1 shadow-sm"
            disabled={isLoading}
          />
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={!query.trim() || isLoading}
            className="shadow-lg shadow-action-600/10"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-surface min-h-[200px] custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-content-muted">
            <Icons.Loader className="h-5 w-5" />
            <p className="text-sm font-medium mb-4">
              Consulting clinical guidelines and sources...
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center px-4 py-2 border border-border-default shadow-sm text-sm font-medium rounded-full text-content-default bg-surface hover:bg-canvas hover:text-content-strong focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
            >
              <Icons.Close className="w-4 h-4 mr-2 text-content-muted" />
              Cancel Search
            </button>
          </div>
        ) : result ? (
          <div className="animate-fade-in-up">
            <ClinicalMarkdown
              content={result}
              groundingSources={sources}
              showReferences={true}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-content-muted">
            <Icons.Book className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">
              Enter a medical question above to find evidence-based answers.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "ACR Criteria for RA",
                "Lantus Dosage Peds",
                "CURB-65 Interpretation",
                "Signs of Appendicitis",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 bg-canvas border border-border-default rounded-full text-[10px] font-bold text-content-secondary hover:bg-action-subtle hover:text-action-hover hover:border-action-border transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default LookupModal;
