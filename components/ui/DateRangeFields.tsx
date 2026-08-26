import React from 'react';
import FieldLabel from './FieldLabel';

interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  maxDate?: string;
  variant?: 'column' | 'inline' | 'toolbar';
  className?: string;
}

export const DateRangeFields: React.FC<DateRangeFieldsProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  maxDate,
  variant = 'column',
  className = "",
}) => {
  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        <FieldLabel>Date Range</FieldLabel>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <input
              type="date"
              value={startDate}
              max={endDate || maxDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
            <span className="text-[8px] text-slate-400 mt-0.5 block ml-1 uppercase">Start</span>
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={maxDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
            <span className="text-[8px] text-slate-400 mt-0.5 block ml-1 uppercase">End</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'toolbar') {
    return (
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 ${className}`}>
        <div className="flex flex-col flex-1 sm:flex-none sm:w-[140px]">
          <FieldLabel>Start Date</FieldLabel>
          <input
            type="date"
            value={startDate}
            max={endDate || maxDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all h-[31px] w-full"
          />
        </div>
        <div className="flex flex-col flex-1 sm:flex-none sm:w-[140px]">
          <FieldLabel>End Date</FieldLabel>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={maxDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all h-[31px] w-full"
          />
        </div>
      </div>
    );
  }

  // default 'column' style (e.g. standard horizontal filters)
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="flex flex-col">
        <FieldLabel>Start Date</FieldLabel>
        <input
          type="date"
          value={startDate}
          max={endDate || maxDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
        />
      </div>
      <div className="flex flex-col">
        <FieldLabel>End Date</FieldLabel>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={maxDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
        />
      </div>
    </div>
  );
};

export default DateRangeFields;
