import React, { useState } from "react";
import { DifferentialDiagnosisItem } from "../../../types";
import { formatText } from "../../../components/clinical/formatting";
import { Icons } from "../../../components/ui/Icons";

const DifferentialDiagnosis: React.FC<{
  content?: DifferentialDiagnosisItem[];
}> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || content.length === 0) return null;

  return (
    <div className="mt-6 bg-action-subtle border border-action-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none transition-colors hover:bg-action-100/50 group"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <Icons.Assessment className="h-5 w-5 text-action-500" />
          </div>
          <h4 className="text-sm font-bold text-action-800 uppercase tracking-wide group-hover:text-action-900 transition-colors">
            Differential Diagnosis
          </h4>
        </div>
        <Icons.ChevronDown
          className={`w-5 h-5 text-action-500 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-4 animate-fade-in space-y-4">
          {content.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface rounded border border-action-100 p-4 shadow-sm"
            >
              <h5 className="font-bold text-content-strong mb-3 text-sm">
                {item.diagnosis}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-action-subtle rounded p-3 border border-action-100">
                  <h6 className="text-xs font-bold text-action-800 uppercase mb-1">
                    Evidence For
                  </h6>
                  <ul className="list-disc pl-4 text-xs text-action-900 space-y-1">
                    {item.evidenceFor.map((e, i) => (
                      <li key={i}>{formatText(e)}</li>
                    ))}
                    {item.evidenceFor.length === 0 && (
                      <li className="italic text-action-hover/60">
                        None listed
                      </li>
                    )}
                  </ul>
                </div>
                <div className="bg-attention-50 rounded p-3 border border-attention-100">
                  <h6 className="text-xs font-bold text-attention-800 uppercase mb-1">
                    Evidence Against
                  </h6>
                  <ul className="list-disc pl-4 text-xs text-attention-900 space-y-1">
                    {item.evidenceAgainst.map((e, i) => (
                      <li key={i}>{formatText(e)}</li>
                    ))}
                    {item.evidenceAgainst.length === 0 && (
                      <li className="italic text-attention-700/60">
                        None listed
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DifferentialDiagnosis;
