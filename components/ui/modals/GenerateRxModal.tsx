import React, { useState, useEffect } from 'react';
import { PlanItem, MedicationOrder, MedicationStatus, ParsedMed } from '../../../types';
import { parsePrescriptions } from '../../../services/geminiService';
import { Icons } from '../Icons';
import { motion } from 'motion/react';
import { createId } from '../../../utils';

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
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [lastProcessedPlan, setLastProcessedPlan] = useState<string>('');

  const fetchMeds = async (force: boolean = false) => {
    if (!isOpen || (planData.length === 0 && !force)) return;
    
    const planHash = JSON.stringify(planData);
    // If we already have results for this exact plan content and not forcing, don't re-fetch
    if (!force && planHash === lastProcessedPlan && parsedMeds.length > 0) return;

    setIsLoading(true);
    // Clear selection if the plan actually changed or forcing
    if (planHash !== lastProcessedPlan || force) {
      setParsedMeds([]);
      setSelectedIndices([]);
    }

    try {
      const results = await parsePrescriptions(planData);
      setParsedMeds(results as ParsedMed[]);
      // Auto-select all by default
      setSelectedIndices(results.map((_, i) => i));
      setLastProcessedPlan(planHash);
    } catch (error) {
      console.error("Failed to parse meds", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [isOpen, planData, lastProcessedPlan]);

  const handleRefresh = () => {
    fetchMeds(true);
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleConfirm = () => {
    const medsToAdd: MedicationOrder[] = selectedIndices.map(idx => {
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
        notes: parsed.sig
      };
    });

    onUpsertMeds(medsToAdd);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Icons.Prescription className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Approve Medications</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleRefresh}
              disabled={isLoading || planData.length === 0}
              className="p-2 hover:bg-teal-50 rounded-lg text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Regenerate List"
            >
              <Icons.Refresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <Icons.Close className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-teal-100 rounded-full"></div>
                <div className="absolute top-0 w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-bold text-slate-600 animate-pulse">Analyzing plan and extracting medications...</p>
            </div>
          ) : parsedMeds.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Prescription className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold">No medications identified</h3>
              <p className="text-slate-500 text-sm mt-1">We couldn't find any clear therapeutic intent in the current plan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {parsedMeds.map((med, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleToggleSelect(idx)}
                  className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedIndices.includes(idx) ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIndices.includes(idx) ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 group-hover:border-teal-400'}`}>
                      {selectedIndices.includes(idx) && <Icons.Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{med.drug}</h4>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded uppercase">{med.route}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><Icons.Plan className="w-3.5 h-3.5 text-slate-400" /> {med.dose}</span>
                        <span className="flex items-center gap-1"><Icons.History className="w-3.5 h-3.5 text-slate-400" /> {med.frequency}</span>
                        <span className="flex items-center gap-1"><Icons.Calendar className="w-3.5 h-3.5 text-slate-400" /> {med.duration}</span>
                      </div>
                      {med.sig && (
                        <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                          "Sig: {med.sig}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedIndices.length} med{selectedIndices.length !== 1 ? 's' : ''} will be synced
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isLoading || selectedIndices.length === 0}
              className="px-6 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20 transition-all active:scale-95"
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
