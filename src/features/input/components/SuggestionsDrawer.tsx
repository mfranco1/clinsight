import React, { useState, useEffect } from "react";
import { Icons } from "../../../components/ui/Icons";
import { SuggestionsData } from "../../../types";
import { generateInputSuggestions } from "../../../services/ai/actions";
import { getErrorMessageCompat } from "../../../services/appErrors";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";

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
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (!notesData || notesData.trim().length < 40) {
      setError("Please type more notes to get meaningful suggestions");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateInputSuggestions(notesData);
      setData(result);
    } catch (err: unknown) {
      setError(getErrorMessageCompat(err, "Failed to load suggestions."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data && !isLoading && !error) {
      fetchSuggestions();
    }
  }, [isOpen]);

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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-content-secondary space-y-4">
              <Icons.Loader className="w-8 h-8 text-action-500 animate-spin" />
              <p className="text-sm font-medium">Analyzing current draft...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-action-subtle border border-action-border rounded-xl text-action-hover text-sm mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.AlertCircle className="w-5 h-5" />
                <span className="font-bold">Cannot provide suggestions</span>
              </div>
              <p>{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-8 pb-8">
              {/* Questions Section */}
              <section>
                <h3 className="text-[11px] font-bold text-content-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icons.Chat className="w-4 h-4 text-content-muted" />
                  Suggested Questions
                </h3>

                {data.questions.length > 0 ? (
                  <div className="space-y-4">
                    {data.questions.map((q, i) => (
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

                {data.tests.length > 0 ? (
                  <div className="space-y-4">
                    {data.tests.map((t, i) => (
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
