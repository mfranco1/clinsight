
import React from 'react';
import { ViewMode } from '../types';
import { NAV_ITEMS } from '../config/appConfig';

interface HeaderProps {
  activePatient: {
    name: string;
    mrn: string;
    ageSex: string;
  } | null;
  currentView: ViewMode;
}

const Header: React.FC<HeaderProps> = ({ activePatient, currentView }) => {
  let currentViewLabel = NAV_ITEMS.find(n => n.id === currentView)?.label || 'Workspace';

  if (currentView === ViewMode.APPEND_ENTRY) {
    currentViewLabel = 'New Entry';
  } else if (currentView === ViewMode.SETTINGS) {
    currentViewLabel = 'Settings';
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 relative z-20 shadow-sm">
      {/* View Title / Breadcrumb */}
      <div className="flex items-center">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{currentViewLabel}</h2>
      </div>

      {/* Active Patient Context Card */}
      {activePatient ? (
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full pl-2 pr-5 py-1.5 shadow-sm animate-fade-in-up">
           <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs mr-3">
             {activePatient.name.charAt(0)}
           </div>
           <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {activePatient.name}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase border-l sm:border-none pl-3 sm:pl-0">
                  MRN: <span className="text-slate-600">{activePatient.mrn}</span>
                </span>
                <span className="hidden lg:inline text-[10px] font-bold text-slate-400 uppercase">
                  Age/Sex: <span className="text-slate-600">{activePatient.ageSex}</span>
                </span>
              </div>
           </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
