
import React, { useState, useRef, useEffect } from 'react';
import { medicalLookup } from '../services/geminiService';
import { GroundingSource } from '../types';
import { sendNotification } from '../services/notificationService';
import { Icons } from './ui/Icons';
import ClinicalMarkdown from './ui/ClinicalMarkdown';
import ModalShell from './ui/ModalShell';

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LookupModal: React.FC<LookupModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
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
        if (!isOpen || document.visibilityState === 'hidden') {
          sendNotification("Lookup Result Ready", {
            body: `Search for "${query}" is complete.`,
            tag: "lookup-result"
          });
        }
      }
    } catch (error: any) {
      if (lookupRequestId.current === requestId) {
        if (error.name === 'AbortError') {
          setResult("Search timed out after 60 seconds. Please try again.");
        } else {
          console.error(error);
          setResult("I'm sorry, I encountered an error during the lookup. Please try again.");
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
      iconBgColor="bg-teal-100 text-teal-700"
      size="3xl"
      bodyClassName="flex flex-col overflow-hidden"
      footerActions={
        <button 
          onClick={onClose} 
          className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
        >
          Close
        </button>
      }
    >
      {/* Search Bar */}
      <div className="px-6 py-5 border-b border-slate-50 flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about diagnostic criteria, drug dosages, indications..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:bg-slate-400 shadow-lg shadow-teal-600/10 transition-all active:scale-95 flex items-center shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[200px] custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Icons.Loader className="h-5 w-5" />
               <p className="text-sm font-medium mb-4">Consulting clinical guidelines and sources...</p>
               <button
                 type="button"
                 onClick={handleCancel}
                 className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-full text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
               >
                 <Icons.Close className="w-4 h-4 mr-2 text-slate-400" />
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
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <Icons.Book className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Enter a medical question above to find evidence-based answers.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['ACR Criteria for RA', 'Lantus Dosage Peds', 'CURB-65 Interpretation', 'Signs of Appendicitis'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
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
