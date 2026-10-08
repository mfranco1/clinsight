import React, { useState, useEffect, useRef } from "react";
import { HandoffSummary, GeneralData } from "../../types";
import { Icons } from "../../components/ui/Icons";
import StickyToolbar from "../../components/ui/StickyToolbar";
import { ToolbarButton } from "../../components/ui/ToolbarSections";

import EditableTextArea from "../../components/ui/EditableTextArea";

interface SummaryViewProps {
  data: HandoffSummary;
  patientInfo?: GeneralData;
  onUpdate?: (updatedHandoff: HandoffSummary) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  data,
  patientInfo,
  onUpdate,
  onRefresh,
  isRefreshing,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const handleUpdateOneLiner = (value: string) => {
    onUpdate?.({ ...data, oneLiner: value });
  };

  const formatForClipboard = (summary: HandoffSummary) => {
    let text = `PATIENT SUMMARY\n`;
    text += `Patient: ${summary.patientId}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;

    text += `SUMMARY:\n${summary.oneLiner}\n\n`;

    text += `ACTIVE ISSUES:\n`;
    if (summary.activeIssues.length === 0) text += `None listed.\n`;
    summary.activeIssues.forEach((issue) => (text += `- ${issue}\n`));
    text += `\n`;

    text += `ACTION ITEMS:\n`;
    if (summary.toDoList.length === 0) text += `Nothing pending.\n`;
    summary.toDoList.forEach((item) => (text += `[ ] ${item}\n`));

    if (summary.clinicalPearl) {
      text += `\nCLINICAL PEARL:\n${summary.clinicalPearl}\n`;
    }

    return text;
  };

  const handleCopy = () => {
    const text = formatForClipboard(data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-slide-up-fade">
      <StickyToolbar>
        <div className="flex items-center justify-end px-2 sm:px-4 py-2 min-h-[52px] overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {onRefresh && (
              <ToolbarButton
                onClick={onRefresh}
                icon={isRefreshing ? Icons.Loader : Icons.RefreshCw}
                label={isRefreshing ? "Refreshing..." : "Refresh"}
                variant="secondary"
                disabled={isRefreshing}
                className={isRefreshing ? "animate-pulse" : ""}
                hideLabelOnMobile={true}
              />
            )}
            <ToolbarButton
              onClick={handleCopy}
              icon={copied ? Icons.Check : Icons.Copy}
              label={copied ? "Copied" : "Copy"}
              variant={copied ? "success" : "secondary"}
              hideLabelOnMobile={true}
            />
          </div>
        </div>
      </StickyToolbar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
        {/* Patient Identification Header */}
        <div className="bg-teal-600 px-8 py-6 border-b border-teal-700">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {patientInfo
              ? `${patientInfo.patientName}${patientInfo.ageSex !== "Not Recorded" ? `, ${patientInfo.ageSex}` : ""}`
              : data.patientId}
          </h2>
          <p className="text-slate-100 text-xs mt-1 font-medium uppercase tracking-wider">
            {patientInfo ? (
              <>
                {patientInfo.mrn !== "Not Recorded" && `${patientInfo.mrn}`}
                {patientInfo.location &&
                  patientInfo.location !== "Not Recorded" && (
                    <>
                      <span className="mx-2 opacity-50">|</span>
                      {patientInfo.location}
                    </>
                  )}
              </>
            ) : (
              "Patient Identification"
            )}
          </p>
        </div>

        <div className="p-8">
          {/* Summary Section */}
          <div className="mb-10 group relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Icons.List className="w-4 h-4 mr-2" />
                Patient Summary
              </h3>
              {!isEditingSummary && (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Edit Summary"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <EditableTextArea
              value={data.oneLiner}
              onSave={(val) => {
                handleUpdateOneLiner(val);
                setIsEditingSummary(false);
              }}
              onCancel={() => setIsEditingSummary(false)}
              onChange={handleUpdateOneLiner}
              placeholder="Enter patient summary..."
              className="text-xs text-slate-800 leading-relaxed"
              isEditing={isEditingSummary}
              setIsEditing={setIsEditingSummary}
              hideEditButton={true}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Issues */}
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-red-100 rounded-md mr-3">
                  <Icons.Alert className="w-3 h-3 text-red-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Issues
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg flex-grow shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {data.activeIssues.map((issue, i) => (
                    <li
                      key={i}
                      className="p-4 flex items-start hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-red-400 mr-3"></span>
                      <span className="text-xs text-slate-700 font-medium">
                        {issue}
                      </span>
                    </li>
                  ))}
                  {data.activeIssues.length === 0 && (
                    <li className="p-4 text-slate-400 italic text-sm">
                      No active issues listed.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* To-Do List */}
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-teal-100 rounded-md mr-3">
                  <Icons.Assessment className="w-3 h-3 text-teal-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Action Items
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg flex-grow shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {data.toDoList.map((todo, i) => (
                    <li
                      key={i}
                      className="p-4 flex items-start hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center h-5">
                        <input
                          id={`todo-${i}`}
                          name={`todo-${i}`}
                          type="checkbox"
                          className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                      <label
                        htmlFor={`todo-${i}`}
                        className="ml-3 text-xs text-slate-700 group-hover:text-slate-900 cursor-pointer select-none"
                      >
                        {todo}
                      </label>
                    </li>
                  ))}
                  {data.toDoList.length === 0 && (
                    <li className="p-4 text-slate-400 italic text-xs">
                      Nothing pending
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Clinical Pearl */}
          {data.clinicalPearl && (
            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-5 flex items-start">
                <Icons.Info className="w-5 h-5 text-teal-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-teal-900 uppercase tracking-wide mb-1">
                    Clinical Pearl
                  </h4>
                  <p className="text-xs text-teal-800 italic">
                    "{data.clinicalPearl}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-12"></div>
    </div>
  );
};

export default SummaryView;
