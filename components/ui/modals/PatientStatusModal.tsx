import React from 'react';
import { PatientStatus, DeceasedInfo } from '../../../types';
import { Icons } from '../Icons';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateTimeParts } from '../../../utils';

interface PatientStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'DISCHARGE' | 'READMIT' | 'CONSULT' | 'DELETE' | 'DECEASED' | null;
  onConfirm: (data: { dischargeDateTime?: string; deceasedInfo?: DeceasedInfo }) => void;
}

const PatientStatusModal: React.FC<PatientStatusModalProps> = ({
  isOpen,
  onClose,
  action,
  onConfirm,
}) => {
  const [dischargeDate, setDischargeDate] = React.useState('');
  const [dischargeTime, setDischargeTime] = React.useState('');

  const [deceasedDate, setDeceasedDate] = React.useState('');
  const [deceasedTime, setDeceasedTime] = React.useState('');
  const [icod, setIcod] = React.useState('');
  const [acod, setAcod] = React.useState('');
  const [ucod, setUcod] = React.useState('');
  const [ccod, setCcod] = React.useState('');
  const [deceasedNotes, setDeceasedNotes] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (action === 'DISCHARGE') {
        const { date, time } = getLocalDateTimeParts();
        setDischargeDate(date);
        setDischargeTime(time);
      } else if (action === 'DECEASED') {
        const { date, time } = getLocalDateTimeParts();
        setDeceasedDate(date);
        setDeceasedTime(time);
        setIcod('');
        setAcod('');
        setUcod('');
        setCcod('');
        setDeceasedNotes('');
      }
    }
  }, [isOpen, action]);

  const handleConfirm = () => {
    if (action === 'DECEASED') {
      onConfirm({
        deceasedInfo: {
          date: deceasedDate,
          time: deceasedTime,
          causeOfDeath: {
            icod: icod.trim(),
            acod: acod.trim() || undefined,
            ucod: ucod.trim(),
            ccod: ccod.trim() || undefined,
          },
          notes: deceasedNotes.trim() || undefined,
        },
      });
    } else if (action === 'DISCHARGE') {
      onConfirm({
        dischargeDateTime: `${dischargeDate} ${dischargeTime}`,
      });
    } else {
      onConfirm({});
    }
  };

  const title =
    action === 'DISCHARGE' ? 'Discharge Patient?' :
    action === 'READMIT' ? 'Admit Patient?' :
    action === 'DELETE' ? 'Delete Patient Record?' :
    action === 'DECEASED' ? 'Mark Patient as Deceased?' :
    'Register as Outpatient?';

  const confirmLabel =
    action === 'READMIT' ? 'Admit Patient' :
    action === 'CONSULT' ? 'Set as Outpatient' :
    action === 'DELETE' ? 'Delete Record' :
    action === 'DECEASED' ? 'Confirm' :
    'Discharge';

  const variant = action === 'DELETE' || action === 'DECEASED' ? 'danger' : 'info';

  const icon =
    action === 'DISCHARGE' ? Icons.Home :
    action === 'READMIT' ? Icons.Plus :
    action === 'DELETE' ? Icons.Trash :
    action === 'DECEASED' ? Icons.HeartOff :
    Icons.ClipboardList;

  const isConfirmDisabled =
    action === 'DECEASED'
      ? !deceasedDate || !deceasedTime || !icod.trim() || !ucod.trim()
      : false;

  const message =
    action === 'DISCHARGE' ? (
      <div className="space-y-4">
        <p>Are you sure you want to discharge this patient? This will update their status to Discharged.</p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <span className="text-xs font-semibold text-slate-700 block text-left">Set Discharge Date & Time</span>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                value={dischargeDate} 
                onChange={(e) => setDischargeDate(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none h-[36px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
              <input 
                type="time" 
                value={dischargeTime} 
                onChange={(e) => setDischargeTime(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none h-[36px]"
              />
            </div>
          </div>
        </div>
      </div>
    ) : action === 'DECEASED' ? (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <span className="text-xs font-semibold text-slate-700 block text-left">Date & Time of Death <span className="text-rose-500">*</span></span>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                value={deceasedDate} 
                onChange={(e) => setDeceasedDate(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
              <input 
                type="time" 
                value={deceasedTime} 
                onChange={(e) => setDeceasedTime(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 text-left">
          <span className="text-xs font-semibold text-slate-700 block">Cause of Death Certification</span>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Immediate Cause <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Septic Shock"
              value={icod} 
              onChange={(e) => setIcod(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Antecedent Cause
            </label>
            <input 
              type="text" 
              placeholder="e.g. Severe Pneumonia"
              value={acod} 
              onChange={(e) => setAcod(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Underlying Cause <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Metastatic Lung Cancer"
              value={ucod} 
              onChange={(e) => setUcod(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Contributing Cause
            </label>
            <input 
              type="text" 
              placeholder="e.g. Type 2 Diabetes Mellitus"
              value={ccod} 
              onChange={(e) => setCcod(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[36px]"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-left">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Additional Notes
          </label>
          <textarea 
            placeholder="Additional details surrounding the death..."
            value={deceasedNotes} 
            onChange={(e) => setDeceasedNotes(e.target.value)}
            className="w-full border border-slate-200 bg-white rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-rose-500 outline-none h-[72px] resize-none"
          />
        </div>
      </div>
    ) : action === 'READMIT' ? (
      'Are you sure you want to admit this patient? This will set their status as an active admission.'
    ) : action === 'DELETE' ? (
      'Are you sure you want to permanently delete this patient record? This action cannot be undone.'
    ) : (
      'Are you sure you want to register this patient for an outpatient consult?'
    );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      variant={variant}
      icon={icon}
      isConfirmDisabled={isConfirmDisabled}
    />
  );
};

export default PatientStatusModal;
