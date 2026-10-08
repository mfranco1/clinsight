import React, { useState, useEffect, useRef } from "react";
import {
  PlanItem,
  MedicationOrder,
  MedicationStatus,
  ParsedMed,
} from "../../../types";
import { parsePrescriptions } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { Icons } from "../../../components/ui/Icons";
import {
  ErrorState,
  LoadingIndicator,
  Skeleton,
} from "../../../components/ui/LoadingFeedback";
import Button from "../../../components/ui/Button";
import { motion } from "motion/react";
import { createId } from "../../../utils/ids";

interface GenerateRxModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: PlanItem[];
  existingMeds: MedicationOrder[];
  onUpsertMeds: (meds: MedicationOrder[]) => void;
}

const GenerateRxModal: React.FC<GenerateRxModalProps> = ({
  isOpen,
  onClose,
  planData,
  existingMeds,
  onUpsertMeds,
}) => {
  const [parsedMeds, setParsedMeds] = useState<ParsedMed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);
  const activeRequestPlan = useRef<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [lastProcessedPlan, setLastProcessedPlan] = useState<string>("");

  const fetchMeds = async (force: boolean = false) => {
    if (!isOpen || (planData.length === 0 && !force)) return;

    const planHash = JSON.stringify(planData);
    // If we already have results for this exact plan content and not forcing, don't re-fetch
    if (!force && planHash === lastProcessedPlan && parsedMeds.length > 0)
      return;
    if (!force && activeRequestPlan.current === planHash) return;

    const currentRequestId = ++requestId.current;
    activeRequestPlan.current = planHash;
    setIsLoading(true);
    setLoadError(false);
    // Clear selection if the plan actually changed or forcing
    if (planHash !== lastProcessedPlan) {
      setParsedMeds([]);
      setSelectedIndices([]);
    }

    try {
      const results = await parsePrescriptions(planData);
      if (requestId.current === currentRequestId) {
        setParsedMeds(results as ParsedMed[]);
        // Auto-select all by default
        setSelectedIndices(results.map((_, i) => i));
        setLastProcessedPlan(planHash);
      }
    } catch (error) {
      logDiagnostic("error", "Prescription parsing failed.");
      if (requestId.current === currentRequestId) setLoadError(true);
    } finally {
      if (requestId.current === currentRequestId) {
        activeRequestPlan.current = null;
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [isOpen, planData, lastProcessedPlan]);

  useEffect(() => {
    if (!isOpen) {
      requestId.current += 1;
      activeRequestPlan.current = null;
    }
  }, [isOpen]);

  const handleRefresh = () => {
    fetchMeds(true);
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleConfirm = () => {
    const medsToAdd: MedicationOrder[] = selectedIndices.map((idx) => {
      const parsed = parsedMeds[idx];
      return {
        id: createId(),
        drug: parsed.drug || "",
        dose: parsed.dose || "",
        route: parsed.route || "",
        frequency: parsed.frequency || "",
        duration: parsed.duration || "",
        status: MedicationStatus.ACTIVE,
        prescribedDate: new Date().toISOString(),
        prescribedBy: "M. Franco, MD",
        quantity: parsed.quantity,
        notes: parsed.sig,
      };
    });

    onUpsertMeds(medsToAdd);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-action-subtle rounded-xl flex items-center justify-center">
              <Icons.Prescription className="w-6 h-6 text-action" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-strong">
                Approve Medications
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={isLoading || planData.length === 0}
              className="p-2 hover:bg-action-subtle rounded-lg text-content-muted hover:text-action transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Regenerate List"
            >
              <Icons.Refresh
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-canvas rounded-lg text-content-muted transition-colors"
            >
              <Icons.Close className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && parsedMeds.length === 0 ? (
            <div className="space-y-4" aria-busy="true">
              <p className="sr-only" role="status" aria-live="polite">
                Checking the plan for medication requests…
              </p>
              <section className="rounded-xl border border-border-default bg-surface p-4">
                <h3 className="mb-4 text-sm font-semibold text-content-strong">
                  Medication requests
                </h3>
                <div aria-hidden="true" className="space-y-4">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="space-y-2 rounded-control border border-border-subtle p-4"
                    >
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : loadError && parsedMeds.length === 0 ? (
            <ErrorState
              title="Medication requests could not be checked."
              message="Try again to review the current plan."
              action={
                <Button onClick={() => void fetchMeds(true)} size="sm">
                  Try again
                </Button>
              }
            />
          ) : parsedMeds.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Prescription className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-content-strong font-bold">
                No medications identified
              </h3>
              <p className="text-content-secondary text-sm mt-1">
                We couldn't find any clear therapeutic intent in the current
                plan
              </p>
            </div>
          ) : (
            <>
              {isLoading && (
                <LoadingIndicator
                  label="Updating medication review…"
                  size="sm"
                />
              )}
              {loadError && (
                <p
                  className="rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-content-default"
                  role="alert"
                >
                  Refresh failed. The previous medication review remains
                  available.
                </p>
              )}
              <div className="space-y-3">
                {parsedMeds.map((med, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleSelect(idx)}
                    className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedIndices.includes(idx) ? "border-action-500 bg-action-subtle/30" : "border-border-subtle bg-surface hover:border-border-default"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIndices.includes(idx) ? "bg-action-subtle border-action-500 text-white" : "border-neutral-300 group-hover:border-action-400"}`}
                      >
                        {selectedIndices.includes(idx) && (
                          <Icons.Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-content-strong truncate">
                            {med.drug}
                          </h4>
                          <span className="text-[10px] font-bold bg-action-100 text-action-hover px-1.5 py-0.5 rounded uppercase">
                            {med.route}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-content-default">
                          <span className="flex items-center gap-1">
                            <Icons.Plan className="w-3.5 h-3.5 text-content-muted" />{" "}
                            {med.dose}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icons.History className="w-3.5 h-3.5 text-content-muted" />{" "}
                            {med.frequency}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icons.Calendar className="w-3.5 h-3.5 text-content-muted" />{" "}
                            {med.duration}
                          </span>
                        </div>
                        {med.sig && (
                          <div className="mt-2 text-[11px] text-content-secondary bg-canvas p-2 rounded-lg border border-border-subtle italic">
                            "Sig: {med.sig}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-canvas border-t border-border-subtle flex items-center justify-between">
          <div className="text-xs text-content-secondary">
            {selectedIndices.length} med
            {selectedIndices.length !== 1 ? "s" : ""} will be synced
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-content-default hover:bg-neutral-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || selectedIndices.length === 0}
              className="px-6 py-2 bg-action text-white text-sm font-bold rounded-xl hover:bg-action-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-action-600/20 transition-all active:scale-95"
            >
              Sync to Orders
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GenerateRxModal;
