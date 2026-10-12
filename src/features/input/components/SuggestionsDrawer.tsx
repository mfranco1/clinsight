import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icons } from "../../../components/ui/Icons";
import { SuggestionsData } from "../../../types";
import { generateInputSuggestions } from "../../../services/ai/actions";
import { getErrorMessageCompat } from "../../../services/appErrors";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import {
  ErrorState,
  LoadingIndicator,
  Skeleton,
} from "../../../components/ui/LoadingFeedback";
import SidePanelShell from "../../../components/ui/SidePanelShell";

interface SuggestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notesData: string;
}

const SuggestionsDrawer: React.FC<SuggestionsDrawerProps> = ({
  isOpen,
  onClose,
  notesData,
}) => {
  const [data, setData] = useState<{
    source: string;
    result: SuggestionsData;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    source: string;
    message: string;
  } | null>(null);
  const requestId = useRef(0);
  const activeSource = useRef<string | null>(null);
  const currentData = data?.source === notesData ? data.result : null;
  const currentError = error?.source === notesData ? error.message : null;

  const fetchSuggestions = useCallback(async () => {
    if (!notesData || notesData.trim().length < 40) {
      setError({
        source: notesData,
        message: "Please type more notes to get meaningful suggestions",
      });
      return;
    }
    if (activeSource.current === notesData) return;
    activeSource.current = notesData;
    setError(null);
    setIsLoading(true);
    const currentRequestId = ++requestId.current;
    try {
      const result = await generateInputSuggestions(notesData);
      if (requestId.current === currentRequestId) {
        setData({ source: notesData, result });
      }
    } catch (err: unknown) {
      if (requestId.current === currentRequestId) {
        setError({
          source: notesData,
          message: getErrorMessageCompat(err, "Failed to load suggestions."),
        });
      }
    } finally {
      if (requestId.current === currentRequestId) {
        activeSource.current = null;
        setIsLoading(false);
      }
    }
  }, [notesData]);

  useEffect(() => {
    if (isOpen && !currentData && !currentError) {
      void fetchSuggestions();
    }
  }, [isOpen, notesData, currentData, currentError, fetchSuggestions]);

  return (
    <SidePanelShell
      isOpen={isOpen}
      onClose={onClose}
      title="Suggestions"
      icon={Icons.Assistance}
      bodyClassName="p-5"
      headerActions={
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md bg-transparent px-3 py-1.5 text-xs font-semibold text-content-primary transition-colors hover:bg-action-subtle hover:text-action-hover disabled:opacity-50"
          title="Reload suggestions based on current draft"
        >
          <Icons.RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Reload
        </button>
      }
    >
      {isLoading && !currentData ? (
        <div className="space-y-6" aria-busy="true">
          <LoadingIndicator label="Preparing suggestions…" />
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-content-secondary">
              Suggested Questions
            </h3>
            <div aria-hidden="true" className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-content-secondary">
              Suggested Tests
            </h3>
            <div aria-hidden="true" className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </section>
        </div>
      ) : currentError && !currentData ? (
        <ErrorState
          variant="section"
          title="Cannot provide suggestions"
          message={currentError}
          action={
            <button
              type="button"
              onClick={() => void fetchSuggestions()}
              className="font-semibold underline"
            >
              Try again
            </button>
          }
        />
      ) : currentData ? (
        <div className="space-y-8 pb-8">
          {isLoading && (
            <LoadingIndicator label="Updating suggestions…" size="sm" />
          )}
          {currentError && (
            <ErrorState
              variant="inline"
              title="Could not update suggestions"
              message={currentError}
              className="text-content-default"
            />
          )}
          {/* Questions Section */}
          <section>
            <h3 className="text-[11px] font-bold text-content-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icons.Chat className="w-4 h-4 text-content-muted" />
              Suggested Questions
            </h3>

            {currentData.questions.length > 0 ? (
              <div className="space-y-4">
                {currentData.questions.map((q, i) => (
                  <div
                    key={i}
                    className="bg-surface border text-sm border-border-default shadow-sm rounded-xl p-4 hover:border-action-300 transition-colors group"
                  >
                    <div className="mb-3 pr-2 font-semibold leading-snug text-neutral-800">
                      <ClinicalMarkdown content={q.text} showSource={false} />
                    </div>
                    <div className="bg-canvas p-3 rounded-lg border border-border-subtle flex items-start gap-2 group-hover:bg-action-subtle/50 transition-colors">
                      <Icons.Rationale className="w-4 h-4 text-action mt-0.5 shrink-0" />
                      <div className="text-xs italic leading-relaxed text-content-default">
                        <ClinicalMarkdown
                          content={q.rationale}
                          showSource={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-content-secondary italic bg-surface p-4 rounded-xl border border-border-default">
                No additional questions suggested.
              </div>
            )}
          </section>

          {/* Tests Section */}
          <section>
            <h3 className="text-[11px] font-bold text-content-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icons.Objective className="w-4 h-4 text-content-muted" />
              Suggested Tests
            </h3>

            {currentData.tests.length > 0 ? (
              <div className="space-y-4">
                {currentData.tests.map((t, i) => (
                  <div
                    key={i}
                    className="bg-surface border text-sm border-border-default shadow-sm rounded-xl p-4 hover:border-action-300 transition-colors group"
                  >
                    <div className="mb-3 pr-2 font-semibold leading-snug text-neutral-800">
                      <ClinicalMarkdown content={t.text} showSource={false} />
                    </div>
                    <div className="bg-canvas p-3 rounded-lg border border-border-subtle flex items-start gap-2 group-hover:bg-action-subtle/50 transition-colors">
                      <Icons.Rationale className="w-4 h-4 text-action mt-0.5 shrink-0" />
                      <div className="text-xs italic leading-relaxed text-content-default">
                        <ClinicalMarkdown
                          content={t.rationale}
                          showSource={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-content-secondary italic bg-surface p-4 rounded-xl border border-border-default">
                No additional exams or tests suggested.
              </div>
            )}
          </section>
        </div>
      ) : null}
    </SidePanelShell>
  );
};

export default SuggestionsDrawer;
