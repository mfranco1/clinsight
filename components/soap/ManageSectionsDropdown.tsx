
import React, { useState } from 'react';
import { Icons } from '../ui/Icons';

export interface SectionVisibility {
  subjective: {
    chiefComplaint: boolean;
    hpi: boolean;
    ros: boolean;
    pmh: boolean;
    meds: boolean;
    family: boolean;
    social: boolean;
    anamnesis: boolean;
    birthMaternal: boolean;
    immunizations: boolean;
    nutrition: boolean;
    developmental: boolean;
    headsss: boolean;
    sexualHistory: boolean;
  };
  objective: {
    vitals: boolean;
    anthropometrics: boolean;
    physicalExam: boolean;
    labs: boolean;
    imaging: boolean;
  };
}

interface ManageSectionsDropdownProps {
  visibility: SectionVisibility;
  onChange: (visibility: SectionVisibility) => void;
  onClose: () => void;
}

const ManageSectionsDropdown: React.FC<ManageSectionsDropdownProps> = ({ visibility, onChange, onClose }) => {
  const [expanded, setExpanded] = useState({
    subjective: false,
    objective: false
  });

  const toggleExpanded = (category: 'subjective' | 'objective') => {
    setExpanded(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleSection = (category: 'subjective' | 'objective', section: string) => {
    const newVisibility = { ...visibility };
    (newVisibility[category] as any)[section] = !(newVisibility[category] as any)[section];
    onChange(newVisibility);
  };

  const toggleCategory = (category: 'subjective' | 'objective') => {
    const newVisibility = { ...visibility };
    const allOn = Object.values(newVisibility[category]).every(v => v);
    const targetValue = !allOn;
    
    Object.keys(newVisibility[category]).forEach(key => {
      (newVisibility[category] as any)[key] = targetValue;
    });
    
    onChange(newVisibility);
  };

  const sections = {
    subjective: [
      { id: 'chiefComplaint', label: 'Chief Complaint' },
      { id: 'hpi', label: 'History of Present Illness' },
      { id: 'ros', label: 'Review of Systems' },
      { id: 'pmh', label: 'Past Medical History' },
      { id: 'meds', label: 'Medications & Allergies' },
      { id: 'family', label: 'Family Medical History' },
      { id: 'social', label: 'Personal & Social History' },
      { id: 'anamnesis', label: 'Anamnesis' },
      { id: 'sexualHistory', label: 'Sexual History' },
      { id: 'birthMaternal', label: 'Birth & Maternal History' },
      { id: 'immunizations', label: 'Immunization History' },
      { id: 'nutrition', label: 'Nutritional History' },
      { id: 'developmental', label: 'Developmental History' },
      { id: 'headsss', label: 'HEEADSSSS Assessment' },
    ],
    objective: [
      { id: 'vitals', label: 'Vital Signs' },
      { id: 'anthropometrics', label: 'Anthropometrics' },
      { id: 'physicalExam', label: 'Physical Examination' },
      { id: 'labs', label: 'Laboratory Data' },
      { id: 'imaging', label: 'Imaging & Diagnostics' },
    ]
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-[100] overflow-hidden animate-fade-in origin-top-right">
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Subjective Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group/header">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-transparent p-1 rounded-md transition-colors flex-1"
              onClick={() => toggleExpanded('subjective')}
            >
              <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expanded.subjective ? '' : '-rotate-90'}`} />
              <Icons.Subjective className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subjective</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCategory('subjective'); }}
              className="text-[9px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider opacity-0 group-hover/header:opacity-100 transition-opacity"
            >
              Toggle All
            </button>
          </div>
          {expanded.subjective && (
            <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {sections.subjective.map(section => (
                <label key={section.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={(visibility.subjective as any)[section.id]}
                      onChange={() => toggleSection('subjective', section.id)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-all cursor-pointer"
                    />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${ (visibility.subjective as any)[section.id] ? 'text-slate-700' : 'text-slate-400' }`}>
                    {section.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Objective Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group/header">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-transparent p-1 rounded-md transition-colors flex-1"
              onClick={() => toggleExpanded('objective')}
            >
              <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expanded.objective ? '' : '-rotate-90'}`} />
              <Icons.Objective className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objective</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCategory('objective'); }}
              className="text-[9px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider opacity-0 group-hover/header:opacity-100 transition-opacity"
            >
              Toggle All
            </button>
          </div>
          {expanded.objective && (
            <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {sections.objective.map(section => (
                <label key={section.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={(visibility.objective as any)[section.id]}
                      onChange={() => toggleSection('objective', section.id)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-all cursor-pointer"
                    />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${ (visibility.objective as any)[section.id] ? 'text-slate-700' : 'text-slate-400' }`}>
                    {section.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-center">
        Hiding sections will not delete their content
      </div>
    </div>
  );
};

export default ManageSectionsDropdown;
