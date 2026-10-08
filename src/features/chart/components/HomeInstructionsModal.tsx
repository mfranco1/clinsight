import React, { useState, useEffect, useRef } from "react";
import { SoapNote, GeneralData } from "../../../types";
import { generateHomeInstructions } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { Icons } from "../../../components/ui/Icons";
import { ErrorState, Skeleton } from "../../../components/ui/LoadingFeedback";
import Button from "../../../components/ui/Button";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import { replaceSourceEditorsWithPrintText } from "./homeInstructionsPrint";

interface HomeInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soapData: SoapNote;
  // Fix: Added patientInfo to props
  patientInfo: GeneralData;
}

interface HomeInstructionsData {
  diet: string[];
  lifestyle: string[];
  activity: string[];
  redFlags: string[];
  referrals: string[];
  followUp: string;
}

const HomeInstructionsModal: React.FC<HomeInstructionsModalProps> = ({
  isOpen,
  onClose,
  soapData,
  // Fix: Added patientInfo to destructive props
  patientInfo,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storedData, setStoredData] = useState<{
    source: string;
    value: HomeInstructionsData;
  } | null>(null);
  const sourceKey = JSON.stringify(soapData);
  const data = storedData?.source === sourceKey ? storedData.value : null;
  const setData = (value: HomeInstructionsData) =>
    setStoredData({ source: sourceKey, value });
  const [printError, setPrintError] = useState<string | null>(null);
  const [storedLoadError, setStoredLoadError] = useState<{
    source: string;
    message: string;
  } | null>(null);
  const loadError =
    storedLoadError?.source === sourceKey ? storedLoadError.message : null;
  const setLoadError = (message: string | null) =>
    setStoredLoadError(message ? { source: sourceKey, message } : null);
  const activeRequest = useRef<{ source: string; id: number } | null>(null);
  const requestId = useRef(0);

  // Clinic Info (Editable)
  const [physicianName, setPhysicianName] = useState("Juan Dela Cruz, MD");

  useEffect(() => {
    if (
      isOpen &&
      !data &&
      !loadError &&
      activeRequest.current?.source !== sourceKey
    ) {
      const fetchData = async () => {
        const currentRequestId = ++requestId.current;
        activeRequest.current = { source: sourceKey, id: currentRequestId };
        setIsLoading(true);
        try {
          const result = await generateHomeInstructions(soapData);
          if (requestId.current === currentRequestId) {
            setData(result);
          }
        } catch (error) {
          logDiagnostic("error", "Home instructions request failed.");
          if (requestId.current === currentRequestId) {
            setLoadError("Home instructions could not be prepared.");
          }
        } finally {
          if (requestId.current === currentRequestId) {
            activeRequest.current = null;
            setIsLoading(false);
          }
        }
      };
      void fetchData();
    }
  }, [isOpen, soapData, sourceKey, data, loadError]);

  useEffect(() => {
    if (!isOpen && activeRequest.current) {
      requestId.current += 1;
      activeRequest.current = null;
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("home-instructions-document");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrintError("Please allow popups to print.");
      return;
    }
    setPrintError(null);

    const clone = printContent.cloneNode(true) as HTMLElement;

    // Sync inputs and textareas
    const originalInputs = printContent.querySelectorAll("input, textarea");
    const clonedInputs = clone.querySelectorAll("input, textarea");

    originalInputs.forEach((input, index) => {
      const clonedInput = clonedInputs[index];
      if (input instanceof HTMLTextAreaElement) {
        const printedText = document.createElement("div");
        printedText.className = "print-textarea";
        printedText.textContent = input.value;
        printedText.style.minHeight = input.style.height;
        clonedInput.replaceWith(printedText);
      } else {
        const clonedTextInput = clonedInput as HTMLInputElement;
        clonedTextInput.value = (input as HTMLInputElement).value;
        clonedTextInput.setAttribute(
          "value",
          (input as HTMLInputElement).value,
        );
      }
    });

    replaceSourceEditorsWithPrintText(printContent, clone);

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Home Instructions</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: white; margin: 0; }
            @page { margin: 0; size: auto; }
            
            .print\\:hidden { display: none !important; }
            
            textarea, input { 
                border: none !important; 
                background: transparent !important; 
                resize: none; 
                overflow: hidden; 
                box-shadow: none !important;
            }
            .print-textarea { white-space: pre-wrap; overflow-wrap: anywhere; border: none; background: transparent; }
            
            /* Clean placeholder text for print */
            ::placeholder { color: transparent; }

            #home-instructions-document { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important; 
                min-height: 100vh !important;
                padding: 40px !important; 
            }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
          <script>
            window.onload = function() { 
                setTimeout(() => {
                    window.print();
                }, 800); 
            }
          </script>
        </body>
      </html>
    `);
    doc.title = `Home Instructions - ${patientInfo.patientName}`;
    doc.close();
  };

  const updateData = <Field extends keyof HomeInstructionsData>(
    field: Field,
    value: HomeInstructionsData[Field],
  ) => {
    if (data) {
      setData({ ...data, [field]: value });
    }
  };

  const updateArrayData = (
    field: "redFlags" | "referrals" | "diet" | "lifestyle" | "activity",
    index: number,
    value: string,
  ) => {
    if (data) {
      const newArray = [...data[field]];
      newArray[index] = value;
      setData({ ...data, [field]: newArray });
    }
  };

  const addArrayItem = (
    field: "redFlags" | "referrals" | "diet" | "lifestyle" | "activity",
  ) => {
    if (data) {
      setData({ ...data, [field]: [...data[field], ""] });
    }
  };

  const removeArrayItem = (
    field: "redFlags" | "referrals" | "diet" | "lifestyle" | "activity",
    index: number,
  ) => {
    if (data) {
      const newArray = [...data[field]];
      newArray.splice(index, 1);
      setData({ ...data, [field]: newArray });
    }
  };

  // Section Icons
  const SectionIcons = {
    // Diet: Heart Icon (Nutrition/Health)
    Diet: () => <Icons.Activity className="w-5 h-5 text-action" />,
    // Activity: Fire Icon (Energy/Burn)
    Activity: () => <Icons.Activity className="w-5 h-5 text-action" />,
    Lifestyle: () => <Icons.HomeHealth className="w-5 h-5 text-action" />,
    RedFlags: () => <Icons.Alert className="w-5 h-5 text-danger-600" />,
    Referrals: () => <Icons.General className="w-5 h-5 text-action" />,
    FollowUp: () => <Icons.Clock className="w-5 h-5 text-action" />,
  };

  const renderListSection = (
    title: string,
    field: "diet" | "lifestyle" | "activity" | "referrals",
    icon: React.ReactNode,
    placeholder: string,
    cols: string = "col-span-1",
  ) => (
    <div
      className={`${cols} rounded-lg p-5 border border-border-default hover:border-action-border transition-colors print:border-border-default print:p-4`}
    >
      <h3 className="flex items-center text-neutral-800 font-bold uppercase text-sm tracking-wider mb-3">
        <span className="p-1.5 bg-action-subtle rounded mr-2 print:hidden">
          {icon}
        </span>
        {title}
      </h3>
      {data![field].length > 0 ? (
        <ul className="space-y-2">
          {data![field].map((item, idx) => (
            <li key={idx} className="flex items-start group">
              <span className="text-action-500 mr-2 mt-1">•</span>
              <div className="flex-1 relative">
                <EditableTextArea
                  value={item}
                  onSave={(v) => updateArrayData(field, idx, v)}
                  onChange={(v) => updateArrayData(field, idx, v)}
                  className="w-full bg-transparent border-none p-0"
                  placeholder={placeholder}
                  showControls={false}
                  isEditing={true}
                  autoFocus={false}
                />
                <button
                  onClick={() => removeArrayItem(field, idx)}
                  className="absolute -right-6 top-0 text-neutral-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 print:hidden transition-opacity"
                >
                  <Icons.Trash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-content-muted italic">
          No specific recommendations.
        </p>
      )}
      <button
        onClick={() => addArrayItem(field)}
        className="mt-3 text-xs text-action hover:text-action-800 font-bold flex items-center print:hidden"
      >
        <span className="mr-1">
          <Icons.Plus />
        </span>{" "}
        Add Item
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-surface print:static">
      <div className="relative w-full max-w-4xl bg-neutral-200 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-h-none print:h-auto print:w-full print:rounded-none">
        {/* Modal Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-default print:hidden">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center">
            <div className="p-1.5 bg-action-subtle rounded-md mr-3 text-action">
              <Icons.HomeHealth className="w-5 h-5" />
            </div>
            Home Instructions & Wellness Plan
          </h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-default"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-canvas px-6 py-3 border-b border-border-default flex justify-end items-center print:hidden">
          <button
            onClick={handlePrint}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-action text-white font-medium rounded-md hover:bg-action-hover shadow-sm transition-colors disabled:opacity-50"
          >
            <Icons.Print />
            <span className="ml-2">Print Instructions</span>
          </button>
        </div>

        {printError && (
          <div
            role="alert"
            className="mx-6 mt-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700"
          >
            {printError}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setPrintError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Area - Gray Background for "Paper" feel */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-muted print:bg-surface print:p-0 print:overflow-visible">
          {isLoading ? (
            <div
              className="mx-auto mb-10 flex min-h-[297mm] w-full max-w-[210mm] flex-col gap-8 border border-border-default bg-surface p-6 shadow-lg sm:p-10"
              aria-busy="true"
            >
              <p className="sr-only" role="status" aria-live="polite">
                Preparing home instructions…
              </p>
              <header className="flex flex-col justify-between gap-6 border-b-4 border-action-600 pb-6 sm:flex-row">
                <div>
                  <h1 className="mb-2 text-3xl font-bold uppercase tracking-tight text-content-strong">
                    Home Instructions
                  </h1>
                  <p className="text-content-secondary font-medium">
                    Patient Wellness &amp; Discharge Plan
                  </p>
                </div>
                <div className="text-sm text-content-secondary">
                  <p className="text-lg font-bold text-content-strong">
                    Clinsight Medical
                  </p>
                  <p>123 Medical Arts Bldg</p>
                  <p>Health City, Metro Manila</p>
                </div>
              </header>
              <section className="flex items-end justify-between rounded-lg border border-border-subtle bg-canvas p-6">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-content-muted">
                    Patient Name
                  </p>
                  <p className="text-xl font-bold text-content-strong">
                    {patientInfo.patientName}
                  </p>
                  <p className="mt-1 text-sm text-content-default">
                    {patientInfo.ageSex} • {patientInfo.mrn}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-content-muted">
                    Date
                  </p>
                  <p className="text-lg font-medium text-content-strong">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </section>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  "Red Flags",
                  "Recommended Diet",
                  "Activity & Exercise",
                  "Lifestyle & Wellness",
                  "Referrals",
                  "Follow Up",
                ].map((title, index) => (
                  <section
                    key={title}
                    className={`rounded-lg border border-border-default p-5 ${index === 0 || index === 3 ? "md:col-span-2" : ""}`}
                  >
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-content-secondary">
                      {title}
                    </h3>
                    <div className="space-y-3" aria-hidden="true">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      {index % 2 === 0 && <Skeleton className="h-4 w-2/3" />}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : loadError ? (
            <div className="mx-auto mt-6 max-w-[210mm]">
              <ErrorState
                title="Home instructions could not be prepared."
                message="Try again to generate a new draft for clinician review."
                action={
                  <Button onClick={() => setLoadError(null)} size="sm">
                    Try again
                  </Button>
                }
              />
            </div>
          ) : data ? (
            <div
              id="home-instructions-document"
              className="bg-surface w-full max-w-[210mm] min-h-[297mm] shadow-lg p-10 print:shadow-none print:p-0 print:w-full mx-auto text-content-strong border border-border-default print:border-none mb-10 flex flex-col gap-8"
            >
              {/* Document Header */}
              <div className="border-b-4 border-action-600 pb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-content-strong uppercase tracking-tight mb-2">
                    Home Instructions
                  </h1>
                  <p className="text-content-secondary font-medium">
                    Patient Wellness & Discharge Plan
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-800">
                    Clinsight Medical
                  </div>
                  <div className="text-sm text-content-secondary">
                    123 Medical Arts Bldg
                  </div>
                  <div className="text-sm text-content-secondary">
                    Health City, Metro Manila
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-canvas p-6 rounded-lg border border-border-subtle flex justify-between items-end">
                <div>
                  <div className="text-xs text-content-muted uppercase font-bold tracking-wider mb-1">
                    Patient Name
                  </div>
                  {/* Fix: Access patientName from patientInfo prop instead of soapData.generalData */}
                  <div className="text-xl font-bold text-content-strong">
                    {patientInfo.patientName}
                  </div>
                  {/* Fix: Access ageSex and mrn from patientInfo prop instead of soapData.generalData */}
                  <div className="text-sm text-content-default mt-1">
                    {patientInfo.ageSex} • {patientInfo.mrn}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-content-muted uppercase font-bold tracking-wider mb-1">
                    Date
                  </div>
                  <div className="text-lg font-medium text-content-strong">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-8">
                {/* Red Flags (Full Width) */}
                <div className="col-span-1 md:col-span-2 bg-danger-50 rounded-lg p-6 border border-danger-100 print:col-span-2 print:border-border-default print:bg-surface print:p-4">
                  <h3 className="flex items-center text-danger-800 font-bold uppercase text-sm tracking-wider mb-3">
                    <span className="p-1.5 bg-danger-100 rounded mr-2 print:hidden">
                      <SectionIcons.RedFlags />
                    </span>
                    <span className="print:text-danger-700">Red Flags</span>
                  </h3>
                  <ul className="space-y-2">
                    {data.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start group">
                        <span className="text-danger-500 mr-2 mt-1">•</span>
                        <div className="flex-1 relative">
                          <EditableTextArea
                            value={flag}
                            onSave={(v) => updateArrayData("redFlags", idx, v)}
                            onChange={(v) =>
                              updateArrayData("redFlags", idx, v)
                            }
                            className="w-full bg-transparent border-none p-0"
                            placeholder="Enter warning sign..."
                            showControls={false}
                            isEditing={true}
                            autoFocus={false}
                          />
                          <button
                            onClick={() => removeArrayItem("redFlags", idx)}
                            className="absolute -right-6 top-0 text-danger-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 print:hidden transition-opacity"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => addArrayItem("redFlags")}
                    className="mt-4 text-xs text-danger-600 hover:text-danger-800 font-bold flex items-center print:hidden"
                  >
                    <span className="mr-1">
                      <Icons.Plus />
                    </span>{" "}
                    Add Warning Sign
                  </button>
                </div>

                {/* Diet */}
                {renderListSection(
                  "Recommended Diet",
                  "diet",
                  <SectionIcons.Diet />,
                  "Add dietary recommendation...",
                )}

                {/* Physical Activity */}
                {renderListSection(
                  "Activity & Exercise",
                  "activity",
                  <SectionIcons.Activity />,
                  "Add activity instruction...",
                )}

                {/* Lifestyle / Non-Pharm - Full Width */}
                {renderListSection(
                  "Lifestyle & Wellness",
                  "lifestyle",
                  <SectionIcons.Lifestyle />,
                  "Add lifestyle recommendation...",
                  "col-span-1 md:col-span-2",
                )}

                {/* Referrals */}
                {renderListSection(
                  "Referrals",
                  "referrals",
                  <SectionIcons.Referrals />,
                  "Add referral...",
                )}

                {/* Follow Up */}
                <div className="rounded-lg p-5 border border-border-default hover:border-action-border transition-colors print:border-border-default print:p-4">
                  <h3 className="flex items-center text-neutral-800 font-bold uppercase text-sm tracking-wider mb-3">
                    <span className="p-1.5 bg-action-subtle rounded mr-2 print:hidden">
                      <SectionIcons.FollowUp />
                    </span>
                    Follow Up
                  </h3>
                  <EditableTextArea
                    value={data.followUp}
                    editorMode="source"
                    onSave={(v) => updateData("followUp", v)}
                    onChange={(v) => updateData("followUp", v)}
                    className="w-full bg-transparent border-none p-0"
                    placeholder="Follow up instructions..."
                    showControls={false}
                    isEditing={true}
                    autoFocus={false}
                  />
                </div>
              </div>

              {/* Footer / Signature */}
              <div className="mt-auto pt-8 border-t border-border-default">
                <div className="flex justify-between items-end">
                  <div className="text-xs text-content-muted max-w-xs">
                    This document is a summary of home care instructions. <br />
                    Please bring this to your next appointment.
                  </div>
                  <div className="text-center w-64">
                    <input
                      value={physicianName}
                      onChange={(e) => setPhysicianName(e.target.value)}
                      className="w-full text-center border-b border-neutral-900 pb-1 mb-1 font-bold text-content-strong focus:outline-none bg-transparent"
                    />
                    <div className="text-xs text-content-secondary uppercase tracking-wide">
                      Attending Physician
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default HomeInstructionsModal;
