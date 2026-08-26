import React, { useState } from 'react';
import { PlanItem, GroundingSource, PatientOrder } from '../../types';
import { Icons } from '../ui/Icons';
import { formatLinks } from './utils';
import AddOrderModal from '../AddOrderModal';
import Toast from '../Toast';

import EditableTextArea from '../ui/EditableTextArea';

const EditablePlanCard: React.FC<{
  item: PlanItem;
  index: number;
  groundingSources?: GroundingSource[];
  onSave?: (newItem: PlanItem) => void;
  onDelete?: () => void;
  orders?: PatientOrder[];
  onAddOrder?: (order: PatientOrder) => void;
  readOnly?: boolean;
}> = ({ item, index, groundingSources, onSave, onDelete, orders, onAddOrder, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [problemDraft, setProblemDraft] = useState(item.problem);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for new structured fields
  const [diagnosticsDraft, setDiagnosticsDraft] = useState(item.diagnostics?.join('\n') || '');
  const [therapeuticsDraft, setTherapeuticsDraft] = useState(item.therapeutics?.join('\n') || '');
  const [otherDraft, setOtherDraft] = useState(item.other?.join('\n') || '');
  
  // State for legacy actions field
  const [actionsDraft, setActionsDraft] = useState(item.actions?.join('\n') || '');

  const isLegacy = !item.diagnostics && !item.therapeutics && !item.other && item.actions;

  const handleEditClick = () => {
    setProblemDraft(item.problem);
    setDiagnosticsDraft(item.diagnostics?.join('\n') || '');
    setTherapeuticsDraft(item.therapeutics?.join('\n') || '');
    setOtherDraft(item.other?.join('\n') || '');
    setActionsDraft(item.actions?.join('\n') || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      if (isLegacy) {
        const newActions = actionsDraft.split('\n').filter(line => line.trim() !== '');
        onSave({
            problem: problemDraft,
            actions: newActions.length > 0 ? newActions : undefined
        });
      } else {
        const newDiagnostics = diagnosticsDraft.split('\n').filter(line => line.trim() !== '');
        const newTherapeutics = therapeuticsDraft.split('\n').filter(line => line.trim() !== '');
        const newOther = otherDraft.split('\n').filter(line => line.trim() !== '');
        onSave({
            problem: problemDraft,
            diagnostics: newDiagnostics.length > 0 ? newDiagnostics : undefined,
            therapeutics: newTherapeutics.length > 0 ? newTherapeutics : undefined,
            other: newOther.length > 0 ? newOther : undefined
        });
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAddOrder = (order: PatientOrder) => {
    if (onAddOrder) {
      onAddOrder(order);
      setSuccessMessage(`Order placed: ${order.name}`);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-teal-300 shadow-sm p-5 animate-fade-in mb-4">
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Problem / Diagnosis</label>
          <input 
            type="text" 
            value={problemDraft}
            onChange={(e) => setProblemDraft(e.target.value)}
            className="bg-white w-full p-2 rounded border border-slate-300 text-sm font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder="Problem Name"
          />
        </div>
        
        {isLegacy ? (
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Action Items (one per line)</label>
            <EditableTextArea
              value={actionsDraft}
              onSave={setActionsDraft}
              onChange={setActionsDraft}
              placeholder="- Action item..."
              showControls={false}
              isEditing={true}
              autoFocus={false}
              className="border-slate-300"
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnostics</label>
              <EditableTextArea
                value={diagnosticsDraft}
                onSave={setDiagnosticsDraft}
                onChange={setDiagnosticsDraft}
                placeholder="- Labs, imaging, procedures..."
                showControls={false}
                isEditing={true}
                autoFocus={false}
                className="border-slate-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Therapeutics</label>
              <EditableTextArea
                value={therapeuticsDraft}
                onSave={setTherapeuticsDraft}
                onChange={setTherapeuticsDraft}
                placeholder="- Medications, interventions..."
                showControls={false}
                isEditing={true}
                autoFocus={false}
                className="border-slate-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Other</label>
              <EditableTextArea
                value={otherDraft}
                onSave={setOtherDraft}
                onChange={setOtherDraft}
                placeholder="- Education, monitoring..."
                showControls={false}
                isEditing={true}
                autoFocus={false}
                className="border-slate-300"
              />
            </div>
          </>
        )}

        <div className="flex justify-end items-center space-x-3">
            <button 
                onClick={handleSave} 
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition-colors shadow-sm"
            >
                Save
            </button>
            <button 
                onClick={handleCancel} 
                className="px-3 py-1.5 bg-white text-slate-600 border border-slate-300 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
            >
                Cancel
            </button>
        </div>
      </div>
    );
  }

  const renderList = (items?: string[], title?: string, isDiagnostics?: boolean) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-3 last:mb-0">
        {title && <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{title}</h5>}
        <ul className="space-y-1.5">
          {items.map((action, i) => {
            const cleanText = action.replace(/^[-*•]\s*/, '').trim();
            const isOrdered = orders?.some(o => o.sourceText === cleanText || (o.name === cleanText && !o.sourceText));
            
            return (
              <li key={i} className="flex items-start text-sm text-slate-800 group/item">
                <span className="mr-2 text-teal-500 mt-1">•</span>
                <span className="flex-1 flex items-center justify-between">
                  <span>{formatLinks(action, groundingSources)}</span>
                  {isDiagnostics && (
                    <div className="ml-2 flex-shrink-0 flex items-center">
                      {isOrdered ? (
                        <span className="bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
                          Ordered
                        </span>
                      ) : (
                        onAddOrder && !readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDiagnostic(cleanText);
                              setIsAddOrderModalOpen(true);
                            }}
                            className="text-teal-600 hover:bg-teal-50 p-1 rounded-full transition-colors"
                            title="Add to Orders"
                          >
                            <Icons.Plus className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 group relative hover:border-teal-200 transition-colors mb-4">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-teal-800 text-sm uppercase tracking-wide flex items-center flex-1 mr-4">
          <span className="bg-teal-100 text-teal-700 py-0.5 px-2 rounded mr-2">{index + 1}</span>
          {item.problem}
        </h4>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && !readOnly && (
                <button
                    type="button"
                    onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        onDelete(); 
                    }}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-transparent transition-colors cursor-pointer"
                    title="Delete Problem"
                >
                    <span className="w-4 h-4 flex items-center justify-center pointer-events-none">
                      <Icons.Trash className="w-full h-full" />
                    </span>
                </button>
            )}
            {onSave && !readOnly && (
                <button
                    onClick={handleEditClick}
                    className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center bg-white border border-slate-200 px-2 py-1 rounded hover:bg-teal-50 transition-colors shadow-sm"
                >
                    <Icons.Edit /> <span className="ml-1">Edit</span>
                </button>
            )}
        </div>
      </div>
      
      {isLegacy ? (
        renderList(item.actions)
      ) : (
        <div className="pl-1">
          {renderList(item.diagnostics, "Diagnostics", true)}
          {renderList(item.therapeutics, "Therapeutics", false)}
          {renderList(item.other, "Other", false)}
        </div>
      )}
      
      {isAddOrderModalOpen && (
        <AddOrderModal
          isOpen={isAddOrderModalOpen}
          onClose={() => setIsAddOrderModalOpen(false)}
          onAddOrder={handleAddOrder}
          initialOrderName={selectedDiagnostic}
          sourceText={selectedDiagnostic}
        />
      )}

      {successMessage && (
        <Toast 
          message={successMessage} 
          type="success" 
          onClose={() => setSuccessMessage(null)} 
        />
      )}
    </div>
  );
};

export default EditablePlanCard;