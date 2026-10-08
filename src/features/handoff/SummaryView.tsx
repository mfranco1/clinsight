import React, { useState, useEffect, useRef } from "react";
import { HandoffSummary, GeneralData } from "../../types";
import { Icons } from "../../components/ui/Icons";
import StickyToolbar from "../../components/ui/StickyToolbar";
import { ToolbarButton } from "../../components/ui/ToolbarSections";

import EditableTextArea from "../../components/ui/EditableTextArea";
import ClinicalMarkdown from "../../components/clinical/ClinicalMarkdown";

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

      <div className="bg-surface rounded-xl shadow-sm border border-border-default overflow-hidden animate-fade-in-up">
        {/* Patient Identification Header */}
        <div className="bg-action px-8 py-6 border-b border-action-700">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {patientInfo
              ? `${patientInfo.patientName}${patientInfo.ageSex !== "Not Recorded" ? `, ${patientInfo.ageSex}` : ""}`
              : data.patientId}
          </h2>
          <p className="text-neutral-100 text-xs mt-1 font-medium uppercase tracking-wider">
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
              <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center">
                <Icons.List className="w-4 h-4 mr-2" />
                Patient Summary
              </h3>
              {!isEditingSummary && (
                <button
                  onClick={() => setIsEditingSummary(true)}
                  className="p-1.5 text-content-muted hover:text-action hover:bg-action-subtle rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
              className="text-xs text-neutral-800 leading-relaxed"
              isEditing={isEditingSummary}
              setIsEditing={setIsEditingSummary}
              hideEditButton={true}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Issues */}
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-danger-100 rounded-md mr-3">
                  <Icons.Alert className="w-3 h-3 text-danger-600" />
                </div>
                <h3 className="text-xs font-bold text-content-strong uppercase tracking-wider">
                  Active Issues
                </h3>
              </div>

              <div className="bg-surface border border-border-default rounded-lg flex-grow shadow-sm">
                <ul className="divide-y divide-neutral-100">
                  {data.activeIssues.map((issue, i) => (
                    <li
                      key={i}
                      className="p-4 flex items-start hover:bg-canvas transition-colors"
                    >
                      <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-danger-400 mr-3"></span>
                      <div className="min-w-0 text-xs font-medium text-content-primary">
                        <ClinicalMarkdown content={issue} />
                      </div>
                    </li>
                  ))}
                  {data.activeIssues.length === 0 && (
                    <li className="p-4 text-content-muted italic text-sm">
                      No active issues listed.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* To-Do List */}
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-action-100 rounded-md mr-3">
                  <Icons.Assessment className="w-3 h-3 text-action" />
                </div>
                <h3 className="text-xs font-bold text-content-strong uppercase tracking-wider">
                  Action Items
                </h3>
              </div>

              <div className="bg-surface border border-border-default rounded-lg flex-grow shadow-sm">
                <ul className="divide-y divide-neutral-100">
                  {data.toDoList.map((todo, i) => (
                    <li
                      key={i}
                      className="p-4 flex items-start hover:bg-canvas transition-colors group"
                    >
                      <div className="flex items-center h-5">
                        <input
                          id={`todo-${i}`}
                          name={`todo-${i}`}
                          aria-labelledby={`todo-label-${i}`}
                          type="checkbox"
                          className="focus:ring-focus-ring h-4 w-4 text-action border-neutral-300 rounded cursor-pointer"
                        />
                      </div>
                      <div
                        id={`todo-label-${i}`}
                        className="ml-3 text-xs text-content-primary group-hover:text-content-strong"
                      >
                        <ClinicalMarkdown content={todo} />
                      </div>
                    </li>
                  ))}
                  {data.toDoList.length === 0 && (
                    <li className="p-4 text-content-muted italic text-xs">
                      Nothing pending
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Clinical Pearl */}
          {data.clinicalPearl && (
            <div className="mt-10 pt-8 border-t border-border-subtle">
              <div className="bg-action-subtle border border-action-100 rounded-lg p-5 flex items-start">
                <Icons.Info className="w-5 h-5 text-action-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-action-900 uppercase tracking-wide mb-1">
                    Clinical Pearl
                  </h4>
                  <ClinicalMarkdown
                    content={data.clinicalPearl}
                    className="text-xs text-action-800 italic"
                  />
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
