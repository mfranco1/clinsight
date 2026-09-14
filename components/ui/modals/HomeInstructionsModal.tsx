
import React, { useState, useEffect } from 'react';
import { SoapNote, GeneralData } from '../../../types';
import { generateHomeInstructions } from '../../../services/geminiService';
import { Icons } from '../Icons';
import EditableTextArea from '../EditableTextArea';

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
  patientInfo
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<HomeInstructionsData | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  
  // Clinic Info (Editable)
  const [physicianName, setPhysicianName] = useState("Juan Dela Cruz, MD");
  
  useEffect(() => {
    if (isOpen && !data) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const result = await generateHomeInstructions(soapData);
          setData(result);
        } catch (error) {
          console.error("Failed to generate home instructions", error);
          // Fallback or error handling
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, soapData, data]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('home-instructions-document');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPrintError("Please allow popups to print.");
      return;
    }
    setPrintError(null);

    const clone = printContent.cloneNode(true) as HTMLElement;
    
    // Sync inputs and textareas
    const originalInputs = printContent.querySelectorAll('input, textarea');
    const clonedInputs = clone.querySelectorAll('input, textarea');

    originalInputs.forEach((input, index) => {
        const clonedInput = clonedInputs[index] as HTMLInputElement | HTMLTextAreaElement;
        clonedInput.value = (input as HTMLInputElement).value;
        
        if (clonedInput.tagName === 'TEXTAREA') {
            clonedInput.innerHTML = (input as HTMLTextAreaElement).value;
            clonedInput.style.height = (input as HTMLElement).style.height; // Persist auto-height
        } else {
            clonedInput.setAttribute('value', (input as HTMLInputElement).value);
        }
    });

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Home Instructions - ${patientInfo.patientName}</title>
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
    doc.close();
  };

  const updateData = (field: keyof HomeInstructionsData, value: any) => {
    if (data) {
      setData({ ...data, [field]: value });
    }
  };

  const updateArrayData = (field: 'redFlags' | 'referrals' | 'diet' | 'lifestyle' | 'activity', index: number, value: string) => {
    if (data) {
      const newArray = [...data[field]];
      newArray[index] = value;
      setData({ ...data, [field]: newArray });
    }
  };

  const addArrayItem = (field: 'redFlags' | 'referrals' | 'diet' | 'lifestyle' | 'activity') => {
    if (data) {
      setData({ ...data, [field]: [...data[field], ""] });
    }
  };

  const removeArrayItem = (field: 'redFlags' | 'referrals' | 'diet' | 'lifestyle' | 'activity', index: number) => {
    if (data) {
      const newArray = [...data[field]];
      newArray.splice(index, 1);
      setData({ ...data, [field]: newArray });
    }
  };

  // Section Icons
  const SectionIcons = {
    // Diet: Heart Icon (Nutrition/Health)
    Diet: () => <Icons.Activity className="w-5 h-5 text-teal-600" />,
    // Activity: Fire Icon (Energy/Burn)
    Activity: () => <Icons.Activity className="w-5 h-5 text-teal-600" />,
    Lifestyle: () => <Icons.HomeHealth className="w-5 h-5 text-teal-600" />,
    RedFlags: () => <Icons.Alert className="w-5 h-5 text-red-600" />,
    Referrals: () => <Icons.General className="w-5 h-5 text-teal-600" />,
    FollowUp: () => <Icons.Clock className="w-5 h-5 text-teal-600" />,
  }

  const renderListSection = (
    title: string, 
    field: 'diet' | 'lifestyle' | 'activity' | 'referrals', 
    icon: React.ReactNode, 
    placeholder: string,
    cols: string = "col-span-1"
  ) => (
    <div className={`${cols} rounded-lg p-5 border border-slate-200 hover:border-teal-200 transition-colors print:border-slate-200 print:p-4`}>
        <h3 className="flex items-center text-slate-800 font-bold uppercase text-sm tracking-wider mb-3">
            <span className="p-1.5 bg-teal-50 rounded mr-2 print:hidden">{icon}</span>
            {title}
        </h3>
        {data![field].length > 0 ? (
            <ul className="space-y-2">
                {data![field].map((item, idx) => (
                    <li key={idx} className="flex items-start group">
                        <span className="text-teal-500 mr-2 mt-1">•</span>
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
                                className="absolute -right-6 top-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 print:hidden transition-opacity"
                            >
                                <Icons.Trash />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-slate-400 italic">No specific recommendations.</p>
        )}
        <button onClick={() => addArrayItem(field)} className="mt-3 text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center print:hidden">
            <span className="mr-1"><Icons.Plus /></span> Add Item
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-h-none print:h-auto print:w-full print:rounded-none">
        
        {/* Modal Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 print:hidden">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <div className="p-1.5 bg-teal-50 rounded-md mr-3 text-teal-600">
                <Icons.HomeHealth className="w-5 h-5" />
            </div>
            Home Instructions & Wellness Plan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <Icons.Close />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-end items-center print:hidden">
             <button 
                onClick={handlePrint}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50"
            >
                <Icons.Print />
                <span className="ml-2">Print Instructions</span>
            </button>
        </div>

        {printError && (
          <div role="alert" className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {printError}
            <button type="button" className="ml-2 underline" onClick={() => setPrintError(null)}>Dismiss</button>
          </div>
        )}

        {/* Content Area - Gray Background for "Paper" feel */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Icons.Loader className="h-10 w-10 text-teal-600 mb-4" />
                    <p className="text-slate-500 font-medium">Generating personalized instructions...</p>
                </div>
            ) : data ? (
                <div id="home-instructions-document" className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-10 print:shadow-none print:p-0 print:w-full mx-auto text-slate-900 border border-slate-200 print:border-none mb-10 flex flex-col gap-8">
                    
                    {/* Document Header */}
                    <div className="border-b-4 border-teal-600 pb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight mb-2">Home Instructions</h1>
                            <p className="text-slate-500 font-medium">Patient Wellness & Discharge Plan</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-slate-800">Clinsight Medical</div>
                            <div className="text-sm text-slate-500">123 Medical Arts Bldg</div>
                            <div className="text-sm text-slate-500">Health City, Metro Manila</div>
                        </div>
                    </div>

                    {/* Patient Details */}
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex justify-between items-end">
                        <div>
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Patient Name</div>
                            {/* Fix: Access patientName from patientInfo prop instead of soapData.generalData */}
                            <div className="text-xl font-bold text-slate-900">{patientInfo.patientName}</div>
                            {/* Fix: Access ageSex and mrn from patientInfo prop instead of soapData.generalData */}
                            <div className="text-sm text-slate-600 mt-1">{patientInfo.ageSex} • {patientInfo.mrn}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Date</div>
                            <div className="text-lg font-medium text-slate-900">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-8">
                        
                        {/* Red Flags (Full Width) */}
                        <div className="col-span-1 md:col-span-2 bg-red-50 rounded-lg p-6 border border-red-100 print:col-span-2 print:border-slate-200 print:bg-white print:p-4">
                            <h3 className="flex items-center text-red-800 font-bold uppercase text-sm tracking-wider mb-3">
                                <span className="p-1.5 bg-red-100 rounded mr-2 print:hidden"><SectionIcons.RedFlags /></span>
                                <span className="print:text-red-700">Red Flags</span>
                            </h3>
                            <ul className="space-y-2">
                                {data.redFlags.map((flag, idx) => (
                                    <li key={idx} className="flex items-start group">
                                        <span className="text-red-500 mr-2 mt-1">•</span>
                                        <div className="flex-1 relative">
                                            <EditableTextArea 
                                                value={flag}
                                                onSave={(v) => updateArrayData('redFlags', idx, v)}
                                                onChange={(v) => updateArrayData('redFlags', idx, v)}
                                                className="w-full bg-transparent border-none p-0"
                                                placeholder="Enter warning sign..."
                                                showControls={false}
                                                isEditing={true}
                                                autoFocus={false}
                                            />
                                            <button 
                                                onClick={() => removeArrayItem('redFlags', idx)}
                                                className="absolute -right-6 top-0 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 print:hidden transition-opacity"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => addArrayItem('redFlags')} className="mt-4 text-xs text-red-600 hover:text-red-800 font-bold flex items-center print:hidden">
                                <span className="mr-1"><Icons.Plus /></span> Add Warning Sign
                            </button>
                        </div>

                        {/* Diet */}
                        {renderListSection("Recommended Diet", 'diet', <SectionIcons.Diet />, "Add dietary recommendation...")}

                        {/* Physical Activity */}
                        {renderListSection("Activity & Exercise", 'activity', <SectionIcons.Activity />, "Add activity instruction...")}

                        {/* Lifestyle / Non-Pharm - Full Width */}
                        {renderListSection("Lifestyle & Wellness", 'lifestyle', <SectionIcons.Lifestyle />, "Add lifestyle recommendation...", "col-span-1 md:col-span-2")}

                        {/* Referrals */}
                        {renderListSection("Referrals", 'referrals', <SectionIcons.Referrals />, "Add referral...")}

                        {/* Follow Up */}
                        <div className="rounded-lg p-5 border border-slate-200 hover:border-teal-200 transition-colors print:border-slate-200 print:p-4">
                            <h3 className="flex items-center text-slate-800 font-bold uppercase text-sm tracking-wider mb-3">
                                <span className="p-1.5 bg-teal-50 rounded mr-2 print:hidden"><SectionIcons.FollowUp /></span>
                                Follow Up
                            </h3>
                            <EditableTextArea 
                                value={data.followUp}
                                onSave={(v) => updateData('followUp', v)}
                                onChange={(v) => updateData('followUp', v)}
                                className="w-full bg-transparent border-none p-0"
                                placeholder="Follow up instructions..."
                                showControls={false}
                                isEditing={true}
                                autoFocus={false}
                            />
                        </div>

                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-auto pt-8 border-t border-slate-200">
                        <div className="flex justify-between items-end">
                            <div className="text-xs text-slate-400 max-w-xs">
                                This document is a summary of home care instructions. <br/>
                                Please bring this to your next appointment.
                            </div>
                            <div className="text-center w-64">
                                <input 
                                    value={physicianName}
                                    onChange={(e) => setPhysicianName(e.target.value)}
                                    className="w-full text-center border-b border-slate-900 pb-1 mb-1 font-bold text-slate-900 focus:outline-none bg-transparent"
                                />
                                <div className="text-xs text-slate-500 uppercase tracking-wide">Attending Physician</div>
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
