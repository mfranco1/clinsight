import React, { useState, useEffect } from "react";
import { PlanItem, MedicationOrder, MedicationStatus } from "../../../types";
import { parsePrescriptions } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { Icons } from "../../../components/ui/Icons";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientAddress: string;
  ageSex: string;
  date: string;
  planData?: PlanItem[];
  medications?: MedicationOrder[];
}

interface RxItem {
  id: string | number;
  medication: string;
  dose: string;
  quantity: string;
  sig: string;
}

// Increased from 4 to 6 to utilize wasted space
const ITEMS_PER_PAGE = 6;

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientAddress,
  ageSex,
  date,
  planData,
  medications,
}) => {
  // Clinic & Physician Info
  const [clinicName, setClinicName] = useState("Clinsight Medical Center");
  const [clinicAddress, setClinicAddress] = useState(
    "123 Medical Arts Bldg, Health City",
  );
  const [clinicContact, setClinicContact] = useState("Tel: (02) 8123-4567");
  const [physicianName, setPhysicianName] = useState("Juan Dela Cruz, MD");
  const [licenses, setLicenses] = useState(
    "Lic: 123456 | PTR: 7890123 | S2: 456789",
  );

  // Patient Info (Editable)
  const [rxPatientName, setRxPatientName] = useState(patientName);
  const [rxAddress, setRxAddress] = useState(patientAddress);
  const [rxAgeSex, setRxAgeSex] = useState(ageSex);
  const [rxDate, setRxDate] = useState(date);

  // Prescription Items
  const [items, setItems] = useState<RxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRxPatientName(patientName);
      setRxAddress(patientAddress);
      setRxAgeSex(ageSex);
      setRxDate(date);

      const loadMeds = async () => {
        if (medications && medications.length > 0) {
          const activeMeds = medications.filter(
            (m) => m.status === MedicationStatus.ACTIVE,
          );
          const rxItems = activeMeds.map((m) => {
            return {
              id: m.id,
              medication: m.drug,
              dose: m.dose,
              quantity: m.quantity || "",
              sig: m.notes || "",
            };
          });

          if (rxItems.length === 0) {
            rxItems.push({
              id: Date.now().toString(),
              medication: "",
              dose: "",
              quantity: "",
              sig: "",
            });
          }

          setItems(rxItems);
        } else if (planData && planData.length > 0 && items.length === 0) {
          setIsLoading(true);
          try {
            const results = await parsePrescriptions(planData);

            const rxItems = results.map((m, index) => ({
              id: Date.now() + index,
              medication: m.drug,
              dose: m.dose,
              quantity: m.quantity,
              sig: m.sig,
            }));

            if (rxItems.length === 0) {
              rxItems.push({
                id: Date.now(),
                medication: "",
                dose: "",
                quantity: "",
                sig: "",
              });
            }

            setItems(rxItems);
          } catch (error) {
            logDiagnostic("error", "Prescription data could not be loaded.");
            setItems([
              {
                id: Date.now(),
                medication: "",
                dose: "",
                quantity: "",
                sig: "",
              },
            ]);
          } finally {
            setIsLoading(false);
          }
        }
      };

      loadMeds();
    }
  }, [
    isOpen,
    patientName,
    patientAddress,
    ageSex,
    date,
    planData,
    medications,
  ]);

  const updateItem = (index: number, field: keyof RxItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), medication: "", dose: "", quantity: "", sig: "" },
    ]);
  };

  const requestDelete = (index: number) => {
    setItemToDelete(index);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      const newItems = [...items];
      newItems.splice(itemToDelete, 1);
      setItems(newItems);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-rx");
    if (!printContent) return;

    // Open a new window/tab for the print view
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrintError("Please allow popups to print the prescription.");
      return;
    }
    setPrintError(null);

    // Clone the content node
    const clone = printContent.cloneNode(true) as HTMLElement;

    // Manually sync the input values to the clone
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
      }

      // Sync Checkbox state
      if (
        (input as HTMLInputElement).type === "checkbox" ||
        (input as HTMLInputElement).type === "radio"
      ) {
        (clonedInput as HTMLInputElement).checked = (
          input as HTMLInputElement
        ).checked;
        if ((input as HTMLInputElement).checked) {
          clonedInput.setAttribute("checked", "checked");
        }
      }

      // Sync explicit value attribute for text inputs so it renders
      if (clonedInput instanceof HTMLInputElement) {
        clonedInput.setAttribute("value", (input as HTMLInputElement).value);
      }
    });

    // Construct the new document
    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Prescription</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              background-color: white; 
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            /* Print Specifics */
            @media print {
              body { 
                padding: 0; 
                display: block; 
              }
              .rx-page { 
                box-shadow: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                height: 100vh !important; 
                border: none !important;
                page-break-after: always; 
              }
              .rx-page:last-child {
                page-break-after: auto;
              }
              @page { margin: 0; }
            }

            /* Clean up inputs for static look */
            input, textarea {
                border: none !important;
                background: transparent !important;
                resize: none;
                box-shadow: none !important;
            }
            .print-textarea { white-space: pre-wrap; overflow-wrap: anywhere; border: none; background: transparent; }
            /* Hide placeholders on print */
            ::placeholder { color: transparent; }
            
            /* Hide delete/action buttons in print view */
            button { display: none !important; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
          <script>
            // Wait for Tailwind and Fonts to load before printing
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 800);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  // Calculate pages
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const pages = Array.from({ length: totalPages }, (_, i) =>
    items.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm sm:p-4 overflow-y-auto">
      <div className="relative w-full h-full sm:h-auto sm:max-w-3xl bg-neutral-200 sm:rounded-xl shadow-2xl flex flex-col sm:max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-default">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center">
            <Icons.Prescription className="w-5 h-5 mr-2 text-action" />
            Prescription
          </h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-default"
          >
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-surface-muted px-4 sm:px-6 py-3 border-b border-border-default flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center text-sm">
          <div className="text-content-secondary italic text-xs sm:text-sm">
            Edit fields below. Pages add automatically as you type.
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={addItem}
              className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-surface border border-neutral-300 text-content-primary font-medium rounded-md hover:bg-canvas shadow-sm transition-colors text-xs sm:text-sm"
            >
              <Icons.Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
              Add Item
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-action text-white font-medium rounded-md hover:bg-action-hover shadow-sm transition-colors text-xs sm:text-sm ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icons.Print className="w-4 h-4 mr-1.5 sm:mr-2" />
              Print Rx
            </button>
          </div>
        </div>

        {/* Rx Paper Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-200 flex flex-col items-center gap-8 relative">
          {/* Printable Container */}
          <div id="printable-rx">
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-200/80 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                <div className="bg-surface p-4 rounded-lg shadow-xl flex items-center space-x-3">
                  <Icons.Loader className="h-6 w-6 text-action" />
                  <span className="text-content-primary font-medium">
                    Generating Prescriptions...
                  </span>
                </div>
              </div>
            )}

            {pages.map((pageItems, pageIndex) => (
              <div
                key={pageIndex}
                className={`rx-page bg-surface w-full sm:w-[600px] min-h-[800px] shadow-md p-4 sm:p-8 flex flex-col text-content-strong font-serif relative ${pageIndex > 0 ? "mt-8" : ""}`}
              >
                {/* Clinic Header */}
                <div className="text-center border-b-2 border-neutral-800 pb-4 mb-4">
                  <input
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="bg-surface text-xl font-bold text-center w-full border-none focus:ring-0 p-0 placeholder-neutral-300 font-serif"
                    placeholder="Clinic / Hospital Name"
                  />
                  <input
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="bg-surface text-xs text-center w-full border-none focus:ring-0 p-0 text-content-default placeholder-neutral-300 font-sans"
                    placeholder="Address"
                  />
                  <input
                    value={clinicContact}
                    onChange={(e) => setClinicContact(e.target.value)}
                    className="bg-surface text-xs text-center w-full border-none focus:ring-0 p-0 text-content-default placeholder-neutral-300 font-sans"
                    placeholder="Contact Number"
                  />
                </div>

                {/* Patient Info */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-3 sm:gap-y-2 text-sm mb-6 font-sans items-start">
                  <div className="flex items-center w-full sm:flex-grow sm:min-w-[200px]">
                    <span className="font-bold w-12 flex-shrink-0">Name:</span>
                    <input
                      type="text"
                      value={rxPatientName}
                      onChange={(e) => setRxPatientName(e.target.value)}
                      className="bg-transparent border-b border-neutral-300 w-full px-1 focus:outline-none focus:border-neutral-800 min-w-0"
                    />
                  </div>
                  <div className="flex items-center w-full sm:w-[120px] flex-shrink-0">
                    <span className="font-bold w-16 flex-shrink-0">
                      Age/Sex:
                    </span>
                    <input
                      type="text"
                      value={rxAgeSex}
                      onChange={(e) => setRxAgeSex(e.target.value)}
                      className="bg-transparent border-b border-neutral-300 w-full px-1 focus:outline-none focus:border-neutral-800 min-w-0"
                    />
                  </div>
                  <div className="flex items-center w-full sm:flex-grow sm:min-w-[250px]">
                    <span className="font-bold w-16 flex-shrink-0">
                      Address:
                    </span>
                    <input
                      type="text"
                      value={rxAddress}
                      onChange={(e) => setRxAddress(e.target.value)}
                      className="bg-transparent border-b border-neutral-300 w-full px-1 focus:outline-none focus:border-neutral-800 min-w-0"
                    />
                  </div>
                  <div className="flex items-center w-full sm:w-[140px] flex-shrink-0">
                    <span className="font-bold w-10 flex-shrink-0">Date:</span>
                    <input
                      type="text"
                      value={rxDate}
                      onChange={(e) => setRxDate(e.target.value)}
                      className="bg-transparent border-b border-neutral-300 w-full px-1 focus:outline-none focus:border-neutral-800 min-w-0"
                    />
                  </div>
                </div>

                {/* Rx Symbol */}
                <div className="text-4xl font-serif font-bold text-neutral-800 mb-4">
                  ℞
                </div>

                {/* Rx Items */}
                <div className="flex-1 flex flex-col gap-6 font-sans">
                  {pageItems.map((item, idx) => {
                    const globalIndex = pageIndex * ITEMS_PER_PAGE + idx;
                    return (
                      <div key={item.id} className="relative group">
                        {/* Remove Button (Hover) */}
                        <button
                          onClick={() => requestDelete(globalIndex)}
                          className="absolute -left-8 top-2 text-neutral-300 hover:text-danger-500 no-print opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Item"
                        >
                          <Icons.Trash className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2 sm:gap-3 items-baseline">
                          <span className="font-bold text-base sm:text-lg text-content-primary w-5 sm:w-6 text-right shrink-0">
                            {globalIndex + 1}.
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_100px_80px] gap-2 sm:gap-4">
                            {/* Medication */}
                            <div className="flex flex-col">
                              <input
                                value={item.medication}
                                onChange={(e) =>
                                  updateItem(
                                    globalIndex,
                                    "medication",
                                    e.target.value,
                                  )
                                }
                                className="w-full font-bold text-content-strong border-b border-dashed border-neutral-300 focus:border-action focus:outline-none bg-transparent py-1 text-sm sm:text-base"
                                placeholder="Medication Name"
                              />
                            </div>
                            {/* Dose & Qty on same line for mobile if needed, or separate */}
                            <div className="flex gap-3 sm:contents">
                              {/* Dose */}
                              <div className="flex-1 sm:flex sm:flex-col">
                                <div className="flex sm:hidden items-center gap-1 text-[10px] font-bold text-content-muted uppercase mb-0.5">
                                  Dose
                                </div>
                                <input
                                  value={item.dose}
                                  onChange={(e) =>
                                    updateItem(
                                      globalIndex,
                                      "dose",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-neutral-800 border-b border-dashed border-neutral-300 focus:border-action focus:outline-none bg-transparent py-1 text-left sm:text-center text-sm"
                                  placeholder="Dose"
                                />
                              </div>
                              {/* Qty */}
                              <div className="w-20 sm:flex sm:flex-col">
                                <div className="flex sm:hidden items-center gap-1 text-[10px] font-bold text-content-muted uppercase mb-0.5">
                                  Qty
                                </div>
                                <input
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(
                                      globalIndex,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-neutral-800 border-b border-dashed border-neutral-300 focus:border-action focus:outline-none bg-transparent py-1 text-left sm:text-center text-sm"
                                  placeholder="# Qty"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sig Line */}
                        <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-1 items-baseline">
                          <span className="w-5 sm:w-6"></span>{" "}
                          {/* Spacer to align with number */}
                          <span className="font-serif italic font-bold text-content-default mr-2 shrink-0 text-sm sm:text-base">
                            Sig:
                          </span>
                          <textarea
                            value={item.sig}
                            onChange={(e) =>
                              updateItem(globalIndex, "sig", e.target.value)
                            }
                            rows={1}
                            className="flex-1 text-content-primary border-b border-border-default focus:border-action focus:outline-none bg-transparent py-1 text-sm resize-none overflow-hidden h-auto"
                            placeholder="Instructions (e.g. Take 1 tab every 8 hours)"
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height = target.scrollHeight + "px";
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = el.scrollHeight + "px";
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer / Signature */}
                <div className="mt-8 pt-6 sm:pt-8 border-t border-border-subtle italic">
                  <div className="flex flex-col sm:flex-row justify-end gap-6 sm:gap-0">
                    <div className="w-full sm:w-1/2 text-center">
                      <input
                        value={physicianName}
                        onChange={(e) => setPhysicianName(e.target.value)}
                        className="bg-surface text-sm font-bold text-center w-full border-none focus:ring-0 p-0 border-b border-neutral-800 mb-1 font-serif"
                        placeholder="Physician Name"
                      />
                      <div className="text-xs text-content-secondary uppercase font-sans">
                        Lic. Physician
                      </div>
                      <input
                        value={licenses}
                        onChange={(e) => setLicenses(e.target.value)}
                        className="bg-surface text-[10px] text-center w-full border-none focus:ring-0 p-0 text-content-secondary mt-1 font-sans"
                        placeholder="License Numbers"
                      />
                    </div>
                  </div>
                  <div className="mt-6 border-t border-neutral-300 pt-2 flex justify-between items-center text-[10px] text-content-muted font-sans">
                    <span>Generated by Clinsight</span>
                    <span>
                      Page {pageIndex + 1} of {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

        {/* Delete Confirmation Overlay - Moved to be a direct child of the relative container, outside the scrollview */}
        {itemToDelete !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-900/30 backdrop-blur-[1px] rounded-xl">
            <div className="bg-surface rounded-lg shadow-xl p-6 max-w-xs w-full border border-border-default animate-fade-in-up">
              <h3 className="text-lg font-bold text-content-strong mb-2">
                Delete Item?
              </h3>
              <p className="text-content-default mb-6 text-sm">
                Are you sure you want to remove this medication?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-content-default font-medium text-sm hover:bg-surface-muted rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-danger-600 text-white font-medium text-sm rounded hover:bg-danger-700 shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionModal;
