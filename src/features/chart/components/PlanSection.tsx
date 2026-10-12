import React, { useState } from "react";
import {
  PlanItem,
  GeneralData,
  GroundingSource,
  SoapNote,
  BroaderManagement,
  PatientOrder,
} from "../../../types";
import SectionCard from "../../../components/ui/SectionCard";
import EditablePlanCard from "./EditablePlanCard";
import BroaderManagementCard from "./BroaderManagementCard";
import { Icons } from "../../../components/ui/Icons";
import ConfirmationModal from "../../../components/dialogs/ConfirmationModal";

interface PlanSectionProps {
  planData: PlanItem[];
  generalData: GeneralData;
  groundingSources?: GroundingSource[];
  onUpdate?: (data: PlanItem[]) => void;
  onUpdateBroaderManagement?: (data: BroaderManagement) => void;
  fullSoapNote?: SoapNote;
  onOpenRx?: () => void;
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
  orders,
  onAddOrder,
  readOnly = false,
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
    const newPlan = [
      ...planData,
      {
        problem: "New Problem",
        diagnostics: ["New diagnostic item"],
        therapeutics: ["New therapeutic item"],
        other: ["New other item"],
      },
    ];
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
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRx?.();
                }}
                className="text-action hover:text-action-hover text-xs font-bold flex items-center bg-action-subtle px-3 py-1.5 rounded-md border border-action-100 hover:border-action-border transition-colors shadow-sm"
              >
                Generate Rx
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
                onSave={
                  onUpdate
                    ? (newItem) => handleUpdatePlanItem(idx, newItem)
                    : undefined
                }
                onDelete={
                  onUpdate ? () => handleDeletePlanItem(idx) : undefined
                }
                orders={orders}
                onAddOrder={onAddOrder}
                readOnly={readOnly}
              />
            ))
          ) : (
            <p className="text-sm text-content-secondary italic">
              No specific plan generated.
            </p>
          )}
          {onUpdate && !readOnly && (
            <button
              onClick={handleAddPlanItem}
              className="mt-4 w-full py-2 border-2 border-dashed border-border-default rounded-lg text-content-muted hover:border-action-400 hover:text-action font-medium text-sm flex items-center justify-center transition-all group"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform">
                <Icons.Plus />
              </span>
              Add Problem
            </button>
          )}
        </div>
      </SectionCard>

      <ConfirmationModal
        isOpen={planItemToDelete !== null}
        onClose={cancelDeletePlanItem}
        onConfirm={confirmDeletePlanItem}
        title="Delete Plan Item?"
        message="Are you sure you want to delete this problem and its actions? This cannot be undone."
        confirmLabel="Delete"
        closeOnInteractOutside={false}
        closeOnEscape={false}
        icon={Icons.Trash}
      />
    </div>
  );
};

export default PlanSection;
