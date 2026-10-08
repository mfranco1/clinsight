import React, { useState } from "react";
import { BroaderManagement } from "../../../types";
import { Icons } from "../../../components/ui/Icons";
import EditableTextArea from "../../../components/ui/EditableTextArea";

interface BroaderManagementCardProps {
  data?: BroaderManagement;
  onUpdate?: (data: BroaderManagement) => void;
  readOnly?: boolean;
}

const FieldItem: React.FC<{
  label: string;
  field: keyof BroaderManagement;
  value?: string | string[];
  icon?: React.ReactNode;
  onUpdate?: (data: BroaderManagement) => void;
  data: BroaderManagement;
  readOnly?: boolean;
}> = ({ label, field, value, icon, onUpdate, data, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!onUpdate && (!value || (Array.isArray(value) && value.length === 0)))
    return null;

  const displayValue = Array.isArray(value) ? value.join("\n") : value || "";

  const handleSave = (newVal: string) => {
    if (!onUpdate) return;
    if (field === "referrals") {
      const referralsArray = newVal
        .split("\n")
        .filter((line) => line.trim() !== "");
      onUpdate({ ...data, [field]: referralsArray });
    } else {
      onUpdate({ ...data, [field]: newVal });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-start mb-3 last:mb-0 group/item">
      {icon && <div className="mt-0.5 mr-2 text-teal-600">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {label}
          </span>
          {!isEditing && onUpdate && !readOnly && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/item:opacity-100 focus:opacity-100"
              title={`Edit ${label}`}
            >
              <span className="mr-1">
                <Icons.Edit className="w-3 h-3" />
              </span>
              Edit
            </button>
          )}
        </div>
        <EditableTextArea
          value={displayValue}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className="text-xs text-slate-800"
          hideEditButton={true}
          minHeight="min-h-[30px]"
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

const BroaderManagementCard: React.FC<BroaderManagementCardProps> = ({
  data = {},
  onUpdate,
  readOnly = false,
}) => {
  return (
    <div className="bg-teal-50/50 rounded-lg border border-teal-100 p-5 mb-6 shadow-sm">
      <h4 className="font-bold text-teal-800 text-sm uppercase tracking-wide flex items-center mb-4 border-b border-teal-100 pb-2">
        General Management
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <FieldItem
          label="Disposition"
          field="disposition"
          value={data.disposition}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="Diet"
          field="diet"
          value={data.diet}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="IV Fluids"
          field="ivFluids"
          value={data.ivFluids}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="O2 Support"
          field="o2Support"
          value={data.o2Support}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="Monitoring"
          field="monitoring"
          value={data.monitoring}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="Watch Out For"
          field="wof"
          value={data.wof}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
        <FieldItem
          label="Referrals"
          field="referrals"
          value={data.referrals}
          onUpdate={onUpdate}
          data={data}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default BroaderManagementCard;
