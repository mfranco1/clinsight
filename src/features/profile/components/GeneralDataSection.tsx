import React, { useState } from "react";
import { GeneralData, PatientStatus } from "../../../types";
import SectionCard from "../../../components/ui/SectionCard";
import { GeneralDataInput, GeneralDataItem } from "./GeneralDataInput";
import { Icons } from "../../../components/ui/Icons";
import { calculateAge } from "../../../utils/date";
import { normalizePatientAgeSex } from "../../../utils/patient";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";

interface GeneralDataSectionProps {
  data: GeneralData;
  onUpdate?: (data: GeneralData) => void;
}

const GeneralDataSection: React.FC<GeneralDataSectionProps> = ({
  data,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<GeneralData>(() =>
    normalizePatientAgeSex(data),
  );

  const handleEditClick = () => {
    setDraft(normalizePatientAgeSex(data));
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(normalizePatientAgeSex(draft));
    }
    setIsEditing(false);
  };

  // Ensure data we are rendering is normalized
  const normalizedData = normalizePatientAgeSex(data);

  return (
    <SectionCard
      title="Patient Face Sheet"
      icon={<Icons.General />}
      className="group !mb-0 border-action-100 shadow-md ring-1 ring-action-500/5"
      headerActions={
        !isEditing && onUpdate ? (
          <button
            onClick={handleEditClick}
            className="text-action hover:text-action-hover text-[10px] font-bold uppercase tracking-widest flex items-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit Face Sheet"
          >
            <span className="mr-1.5">
              <Icons.Edit className="w-3 h-3" />
            </span>
            Edit
          </button>
        ) : null
      }
    >
      {isEditing ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <GeneralDataInput
            label="Patient Name"
            value={draft.patientName}
            onChange={(v) => setDraft({ ...draft, patientName: v })}
          />
          <GeneralDataInput
            label="Sex"
            value={draft.sex || ""}
            onChange={(v) => setDraft({ ...draft, sex: v })}
          />
          <GeneralDataInput
            label="Case No / MRN"
            value={draft.mrn}
            onChange={(v) => setDraft({ ...draft, mrn: v })}
          />
          <GeneralDataInput
            label="Date of Birth"
            value={draft.dob}
            onChange={(v) => {
              const newAge = calculateAge(v);
              const updated = { ...draft, dob: v };
              if (newAge !== undefined) {
                updated.age = newAge;
              }
              setDraft(updated);
            }}
          />
          {(() => {
            const calculatedAge = calculateAge(draft.dob);
            return calculatedAge !== undefined ? (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-1">
                  Age (Computed)
                </span>
                <span className="text-sm font-medium text-content-strong bg-canvas px-2.5 py-1.5 rounded-lg">
                  {calculatedAge} years
                </span>
              </div>
            ) : (
              <GeneralDataInput
                label="Age"
                value={
                  draft.age !== undefined && draft.age !== null
                    ? draft.age.toString()
                    : ""
                }
                onChange={(v) => {
                  const num = parseInt(v, 10);
                  setDraft({ ...draft, age: isNaN(num) ? undefined : num });
                }}
              />
            );
          })()}
          <GeneralDataInput
            label="Admission Date"
            value={draft.admissionDate}
            onChange={(v) => setDraft({ ...draft, admissionDate: v })}
          />
          <GeneralDataInput
            label="Address"
            value={draft.address}
            onChange={(v) => setDraft({ ...draft, address: v })}
          />
          <GeneralDataInput
            label="Religion"
            value={draft.religion}
            onChange={(v) => setDraft({ ...draft, religion: v })}
          />
          <GeneralDataInput
            label="Handedness"
            value={draft.handedness}
            onChange={(v) => setDraft({ ...draft, handedness: v })}
          />
          <GeneralDataInput
            label="Location"
            value={draft.location || ""}
            onChange={(v) => setDraft({ ...draft, location: v })}
          />
          <GeneralDataInput
            label="Blood Type"
            value={draft.bloodType || ""}
            onChange={(v) => setDraft({ ...draft, bloodType: v })}
          />
          <GeneralDataInput
            label="Contact Number"
            value={draft.contactNumber || ""}
            onChange={(v) => setDraft({ ...draft, contactNumber: v })}
          />
          <GeneralDataInput
            label="Email"
            value={draft.email || ""}
            onChange={(v) => setDraft({ ...draft, email: v })}
          />

          <div className="col-span-2 lg:col-span-4 flex justify-end space-x-3 mt-4 border-t border-border-subtle pt-4">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-action text-white text-xs font-medium rounded hover:bg-action-hover transition-colors shadow-sm"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 bg-surface text-content-default border border-neutral-300 text-xs font-medium rounded hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            <GeneralDataItem
              label="Status"
              value={
                !normalizedData.status ||
                normalizedData.status === PatientStatus.ADMITTED
                  ? "Admitted"
                  : normalizedData.status === PatientStatus.OUTPATIENT
                    ? "Outpatient"
                    : normalizedData.status === PatientStatus.DECEASED
                      ? "Deceased"
                      : "Discharged"
              }
            />
            <GeneralDataItem
              label="Full Name"
              value={normalizedData.patientName}
            />
            <GeneralDataItem
              label="Age"
              value={
                normalizedData.age !== undefined
                  ? `${normalizedData.age} years`
                  : "Not Recorded"
              }
            />
            <GeneralDataItem
              label="Sex"
              value={normalizedData.sex || "Not Recorded"}
            />
            <GeneralDataItem label="MRN" value={normalizedData.mrn} />
            <GeneralDataItem label="Date of Birth" value={normalizedData.dob} />
            <GeneralDataItem
              label="Last Admission"
              value={normalizedData.admissionDate}
            />
            <GeneralDataItem label="Address" value={normalizedData.address} />
            <GeneralDataItem label="Religion" value={normalizedData.religion} />
            <GeneralDataItem
              label="Handedness"
              value={normalizedData.handedness}
            />
            <GeneralDataItem
              label="Location"
              value={normalizedData.location || "Not Recorded"}
            />
            <GeneralDataItem
              label="Blood Type"
              value={normalizedData.bloodType || "Not Recorded"}
            />
            <GeneralDataItem
              label="Contact Number"
              value={normalizedData.contactNumber || "Not Recorded"}
            />
            <GeneralDataItem
              label="Email"
              value={normalizedData.email || "Not Recorded"}
            />
          </div>

          {normalizedData.status === PatientStatus.DECEASED &&
            normalizedData.deceasedInfo && (
              <div className="mt-8 pt-6 border-t border-critical-100 bg-critical-50/20 rounded-2xl p-5 border text-left">
                <div className="flex items-center gap-2 text-critical-700 font-bold text-sm mb-4">
                  <Icons.HeartOff className="w-4 h-4 text-critical-500" />
                  Death Information
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1">
                      Date of Death
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      {normalizedData.deceasedInfo.date}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1">
                      Time of Death
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      {normalizedData.deceasedInfo.time}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-critical-100/50 pt-4">
                  <h4 className="text-[10px] font-extrabold text-content-default uppercase tracking-widest">
                    Certified Causes of Death
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface p-3.5 rounded-xl border border-critical-100/50 shadow-sm">
                      <span className="text-[9px] font-bold text-critical-600 uppercase tracking-wider block mb-1">
                        Immediate Cause of Death
                      </span>
                      <p className="text-xs font-bold text-neutral-800 leading-relaxed">
                        {normalizedData.deceasedInfo.causeOfDeath.icod}
                      </p>
                    </div>

                    <div className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-sm">
                      <span className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block mb-1">
                        Antecedent Cause of Death
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-relaxed">
                        {normalizedData.deceasedInfo.causeOfDeath.acod ||
                          "None certified"}
                      </p>
                    </div>

                    <div className="bg-surface p-3.5 rounded-xl border border-critical-100/50 shadow-sm">
                      <span className="text-[9px] font-bold text-critical-600 uppercase tracking-wider block mb-1">
                        Underlying Cause of Death
                      </span>
                      <p className="text-xs font-bold text-neutral-800 leading-relaxed">
                        {normalizedData.deceasedInfo.causeOfDeath.ucod}
                      </p>
                    </div>

                    <div className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-sm">
                      <span className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block mb-1">
                        Contributing Cause of Death
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-relaxed">
                        {normalizedData.deceasedInfo.causeOfDeath.ccod ||
                          "None certified"}
                      </p>
                    </div>
                  </div>
                </div>

                {normalizedData.deceasedInfo.notes && (
                  <div className="mt-5 border-t border-critical-100/50 pt-4">
                    <span className="text-[9px] font-bold text-content-muted uppercase tracking-wider block mb-1">
                      Notes
                    </span>
                    <ClinicalMarkdown
                      content={normalizedData.deceasedInfo.notes}
                      className="bg-surface p-3 rounded-xl border border-border-subtle text-xs font-medium"
                    />
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </SectionCard>
  );
};

export default GeneralDataSection;
