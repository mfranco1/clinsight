import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icons } from "../../../components/ui/Icons";
import { SuggestionsData } from "../../../types";
import { generateInputSuggestions } from "../../../services/ai/actions";
import { getErrorMessageCompat } from "../../../services/appErrors";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import {
  LoadingIndicator,
  Skeleton,
} from "../../../components/ui/LoadingFeedback";

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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 transition-opacity lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-canvas shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-border-default`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface shadow-sm z-10 relative">
          <div className="flex items-center">
            <div className="bg-action-100 p-1.5 rounded-lg mr-3">
              <Icons.Assistance className="w-5 h-5 text-action" />
            </div>
            <h2 className="text-sm font-bold text-neutral-800">Suggestions</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSuggestions}
              disabled={isLoading}
              className="px-3 py-1.5 bg-transparent text-content-primary hover:bg-action-subtle hover:text-action-hover text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Reload suggestions based on current draft"
            >
              <Icons.RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Reload
            </button>
            <button
              onClick={onClose}
              className="text-content-muted hover:text-content-default p-1 rounded-full hover:bg-neutral-200 transition-colors"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
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
            <div className="p-4 bg-action-subtle border border-action-border rounded-xl text-action-hover text-sm mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.AlertCircle className="w-5 h-5" />
                <span className="font-bold">Cannot provide suggestions</span>
              </div>
              <p>{currentError}</p>
              <button
                type="button"
                onClick={() => void fetchSuggestions()}
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          ) : currentData ? (
            <div className="space-y-8 pb-8">
              {isLoading && (
                <LoadingIndicator label="Updating suggestions…" size="sm" />
              )}
              {currentError && (
                <p
                  className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-content-default"
                  role="alert"
                >
                  Could not update suggestions: {currentError}
                </p>
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
                          <ClinicalMarkdown
                            content={q.text}
                            showSource={false}
                          />
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
                          <ClinicalMarkdown
                            content={t.text}
                            showSource={false}
                          />
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
        </div>
      </div>
    </>
  );
};

export default SuggestionsDrawer;
