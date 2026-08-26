
import React, { useState } from 'react';
import { Icons } from '../ui/Icons';

interface ClinicalAssistanceProps {
  content?: string[];
  sectionTitle: string;
  onGenerateMore?: () => Promise<void>;
  onSelectSuggestions?: (suggestions: string[], sectionTitle: string) => void;
}

const ClinicalAssistance: React.FC<ClinicalAssistanceProps> = ({ 
  content, 
  sectionTitle, 
  onGenerateMore, 
  onSelectSuggestions 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGenerateMore) return;
    
    setIsGenerating(true);
    try {
        await onGenerateMore();
    } catch (err) {
        console.error("Failed to generate suggestions", err);
    } finally {
        setIsGenerating(false);
    }
  };

  // if (!content) return null; // Removed to keep it visible even when empty

  // Split and clean suggestions by bullets, numbers, real or escaped newlines, or all of the above
  const lines: string[] = [];
  if (content) {
    const items = Array.isArray(content) ? content : [content];
    items.forEach(item => {
      if (typeof item !== 'string') return;
      // Normalizes escaped newlines (\n as raw string) into true newlines
      const normalized = item.replace(/\\n/g, '\n');
      normalized.split('\n').forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        // Strip off leader bullet prefixes like "- ", "* ", "1. ", "• ", etc.
        const cleaned = trimmed.replace(/^([-\*\+•]\s*|\d+\.\s*)/, '').trim();
        if (cleaned) {
          lines.push(cleaned);
        }
      });
    });
  }

  const toggleSelection = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleBatchAddress = () => {
    if (selectedIndices.size === 0) return;
    const selected = lines.filter((_, idx) => selectedIndices.has(idx));
    onSelectSuggestions?.(selected, sectionTitle);
    setSelectedIndices(new Set());
  };

  const handleSingleAddress = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSuggestions?.([lines[idx]], sectionTitle);
  };
  
  return (
    <div className="mt-6 bg-teal-50 border border-teal-100 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none transition-colors hover:bg-teal-100/50 group"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <Icons.Assistance className="h-5 w-5 text-teal-500" />
          </div>
          <h4 className="text-sm font-bold text-teal-800 uppercase tracking-wide group-hover:text-teal-900 transition-colors">
            Clinical Assistance
          </h4>
        </div>
        <div className="flex items-center gap-3">
            {!isExpanded && (
                <span className="text-[10px] font-bold text-teal-600 bg-white px-2 py-0.5 rounded-full border border-teal-100 uppercase">
                    {lines.length > 0 ? `${lines.length} Actions` : 'Refined'}
                </span>
            )}
            <Icons.ChevronDown 
              className={`w-5 h-5 text-teal-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {lines.length > 0 ? lines.map((suggestion, i) => {
                const isSelected = selectedIndices.has(i);
                return (
                  <div
                      key={i}
                      onClick={(e) => toggleSelection(i, e)}
                      className={`w-full text-left p-3 rounded-xl border transition-all group/item flex items-center gap-3 cursor-pointer ${isSelected ? 'bg-teal-100 border-teal-300 shadow-sm' : 'bg-white border-teal-100 hover:border-teal-300'}`}
                  >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-600 border-teal-600' : 'border-teal-200 bg-white group-hover/item:border-teal-400'}`}>
                          {isSelected && <Icons.Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs text-teal-900 font-medium leading-relaxed flex-1 pr-4">
                          {suggestion}
                      </span>
                      <button
                          onClick={(e) => handleSingleAddress(i, e)}
                          className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${isSelected ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white'}`}
                      >
                          Address
                      </button>
                  </div>
                );
            }) : (
              <div className="py-8 text-center bg-white/40 rounded-xl border border-dashed border-teal-200">
                <Icons.Check className="w-8 h-8 text-teal-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-teal-600/60 uppercase tracking-wider">All recommendations addressed</p>
                <p className="text-[10px] text-teal-500/50 mt-1">Request more using the button below</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-teal-200/50 flex items-center justify-between">
              <div>
                {selectedIndices.size > 0 && (
                  <button
                    onClick={handleBatchAddress}
                    className="text-xs font-bold bg-teal-600 text-white px-4 py-2 rounded-xl border border-teal-600 hover:bg-teal-700 transition-all shadow-md animate-fade-in-up"
                  >
                    Address {selectedIndices.size} Selected
                  </button>
                )}
              </div>
              
              {onGenerateMore && (
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center bg-white/60 hover:bg-white px-4 py-2 rounded-xl border border-teal-100 hover:border-teal-200 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                      {isGenerating ? (
                          <>
                            <Icons.Loader className="-ml-1 mr-2 h-3 w-3 text-teal-700" />
                            Refining...
                          </>
                      ) : (
                          <>
                            <span className="mr-1.5"><Icons.Plus /></span>
                            More Recommendations
                          </>
                      )}
                  </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalAssistance;
