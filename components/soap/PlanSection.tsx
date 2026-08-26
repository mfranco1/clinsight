
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PlanItem, GeneralData, GroundingSource, SoapNote, BroaderManagement, PatientOrder } from '../../types';
import SectionCard from './SectionCard';
import EditablePlanCard from './EditablePlanCard';
import BroaderManagementCard from './BroaderManagementCard';
import { Icons } from '../ui/Icons';

interface PlanSectionProps {
  planData: PlanItem[];
  generalData: GeneralData;
  groundingSources?: GroundingSource[];
  onUpdate?: (data: PlanItem[]) => void;
  onUpdateBroaderManagement?: (data: BroaderManagement) => void;
  fullSoapNote?: SoapNote;
  onOpenRx?: () => void;
  onOpenInstructions?: () => void;
  orders?: PatientOrder[];
  onAddOrder?: (order: PatientOrder) => void;
  readOnly?: boolean;
}

const PlanSection: React.FC<PlanSectionProps> = ({ 
  planData, 
  generalData, 
  groundingSources, 
  onUpdate, 
  onUpdateBroaderManagement,
  fullSoapNote,
  onOpenRx,
  onOpenInstructions,
  orders,
  onAddOrder,
  readOnly = false
}) => {
  const [planItemToDelete, setPlanItemToDelete] = useState<number | null>(null);

  const handleUpdatePlanItem = (index: number, newItem: PlanItem) => {
    if (!onUpdate) return;
    const newPlan = [...planData];
    newPlan[index] = newItem;
    onUpdate(newPlan);
  };

  const handleDeletePlanItem = (index: number) => {
    setPlanItemToDelete(index);
  };

  const confirmDeletePlanItem = () => {
    if (planItemToDelete !== null && onUpdate) {
        const newPlan = [...planData];
        newPlan.splice(planItemToDelete, 1);
        onUpdate(newPlan);
        setPlanItemToDelete(null);
    }
  };

  const cancelDeletePlanItem = () => {
    setPlanItemToDelete(null);
  };

  const handleAddPlanItem = () => {
    if (!onUpdate) return;
    const newPlan = [...planData, { 
      problem: "New Problem", 
      diagnostics: ["New diagnostic item"],
      therapeutics: ["New therapeutic item"],
      other: ["New other item"]
    }];
    onUpdate(newPlan);
  };

  return (
    <div className="relative">
      <SectionCard 
        title="Plan" 
        icon={<Icons.Plan />}
        collapsible
        headerActions={
            !readOnly && (
              <div className="flex gap-2">
                  <button 
                      onClick={(e) => { e.stopPropagation(); onOpenRx?.(); }}
                      className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center bg-teal-50 px-3 py-1.5 rounded-md border border-teal-100 hover:border-teal-200 transition-colors shadow-sm"
                  >
                      Generate Rx
                  </button>
                  <button 
                      onClick={(e) => { e.stopPropagation(); onOpenInstructions?.(); }}
                      className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center bg-teal-50 px-3 py-1.5 rounded-md border border-teal-100 hover:border-teal-200 transition-colors shadow-sm"
                  >
                      Home Instructions
                  </button>
              </div>
            )
        }
      >
           <div className="space-y-4">
              {(fullSoapNote?.broaderManagement || onUpdateBroaderManagement) && (
                <BroaderManagementCard 
                  data={fullSoapNote?.broaderManagement || {}} 
                  onUpdate={onUpdateBroaderManagement}
                  readOnly={readOnly}
                />
              )}
              
              {planData && planData.length > 0 ? (
                planData.map((item, idx) => (
                  <EditablePlanCard
                    key={`${idx}-${item.problem}`}
                    index={idx}
                    item={item}
                    groundingSources={groundingSources}
                    onSave={onUpdate ? (newItem) => handleUpdatePlanItem(idx, newItem) : undefined}
                    onDelete={onUpdate ? () => handleDeletePlanItem(idx) : undefined}
                    orders={orders}
                    onAddOrder={onAddOrder}
                    readOnly={readOnly}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No specific plan generated.</p>
              )}
              {onUpdate && !readOnly && (
                  <button
                    onClick={handleAddPlanItem}
                    className="mt-4 w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-teal-400 hover:text-teal-600 font-medium text-sm flex items-center justify-center transition-all group"
                  >
                    <span className="mr-2 group-hover:scale-110 transition-transform"><Icons.Plus /></span>
                    Add Problem
                  </button>
              )}
           </div>
      </SectionCard>

      {planItemToDelete !== null && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 transform scale-100 transition-all">
            <div className="flex items-center mb-4 text-red-600">
               <Icons.Trash className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">Delete Plan Item?</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">Are you sure you want to delete this problem and its actions? This cannot be undone.</p>
             <div className="flex justify-end space-x-3">
               <button onClick={cancelDeletePlanItem} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-100 rounded transition-colors">Cancel</button>
               <button onClick={confirmDeletePlanItem} className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded hover:bg-red-700 shadow-sm transition-colors">Delete</button>
             </div>
           </div>
         </div>,
         document.body
      )}
    </div>
  );
};

export default PlanSection;
