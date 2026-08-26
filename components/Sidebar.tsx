import React, { useState } from 'react';
import { ViewMode } from '../types';
import { NAV_ITEMS } from '../constants';
import { Icons } from './ui/Icons';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  showMobileNav: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, showMobileNav }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-white h-screen border-r border-slate-200 shrink-0 z-30 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Ghost Toggle Stripe */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute inset-y-0 -right-1 w-3 group/stripe cursor-pointer z-50"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {/* Vertical Line on Hover */}
          <div className={`absolute inset-y-0 right-1 w-[2px] transition-colors duration-300 ${isCollapsed ? 'bg-slate-200/50' : 'bg-transparent'} group-hover/stripe:bg-teal-500/50`} />
          
          {/* Centered Chevron that fades in on hover */}
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-white border border-slate-200 rounded-full p-1 text-slate-400 
            shadow-sm transition-all duration-300 transform
            opacity-0 group-hover/stripe:opacity-100 
            ${isCollapsed ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}
          `}>
            <Icons.ChevronLeft className="w-3 h-3" />
          </div>
        </div>

        {/* Branding Area */}
        <div className={`h-16 flex items-center border-b border-slate-100 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="h-9 w-9 bg-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-teal-100">
            <Icons.Logo className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="ml-3 font-bold text-xl text-slate-900 tracking-tight animate-fade-in whitespace-nowrap">Clinsight</span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            const isDisabled = false; // Sidebar items are now always enabled
            const IconComponent = Icons[item.icon as keyof typeof Icons] || Icons.Document;

            const inactiveTextClass = 'text-slate-400';
            const inactiveIconClass = 'text-slate-500';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center rounded-xl transition-all duration-200 group relative
                  ${isCollapsed ? 'justify-center h-12 p-0' : 'px-4 py-3 text-sm font-semibold'}
                  ${isActive 
                    ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-100 font-bold' 
                    : `${inactiveTextClass} hover:bg-slate-50 hover:text-slate-900`}
                  cursor-pointer
                `}
              >
                <span className={`transition-colors shrink-0 ${isActive ? 'text-teal-600' : `${inactiveIconClass} group-hover:text-teal-600`}`}>
                  <IconComponent className="w-5 h-5" />
                </span>
                
                {!isCollapsed && (
                  <span className="ml-3 whitespace-nowrap animate-fade-in">{item.label}</span>
                )}
                
                {isActive && isCollapsed && (
                  <div className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`mt-auto border-t border-slate-100 bg-slate-50/50 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={() => onNavigate(ViewMode.SETTINGS)}
            title={isCollapsed ? "Settings" : undefined}
            className={`
              w-full flex items-center rounded-xl transition-all duration-200 group mb-1
              ${isCollapsed ? 'justify-center h-12 p-0 text-slate-600 hover:text-teal-600 hover:bg-teal-50' : 'px-4 py-3 text-sm font-semibold text-slate-600 hover:text-teal-600 hover:bg-teal-50'}
              ${currentView === ViewMode.SETTINGS ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-100' : ''}
            `}
          >
            <Icons.Settings className={`w-5 h-5 shrink-0 ${currentView === ViewMode.SETTINGS ? 'text-teal-600' : ''}`} />
            {!isCollapsed && <span className="ml-3 whitespace-nowrap animate-fade-in">Settings</span>}
          </button>
          
          {!isCollapsed ? (
            <div className="mt-4 px-4 py-3 bg-white border border-slate-200 rounded-2xl animate-fade-in shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 shadow-sm">MF</div>
                  <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">Marty Franco</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Clinician</p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Logout"
                  >
                    <Icons.Logout className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-2 py-2">
               <button 
                  onClick={onLogout}
                  className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all shadow-sm"
                  title="Logout (Marty Franco)"
                >
                  MF
               </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50 transition-transform duration-300 ${showMobileNav ? 'translate-y-0' : 'translate-y-full'}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const IconComponent = Icons[item.icon as keyof typeof Icons] || Icons.Document;

          let displayLabel = item.label.split(' ')[0];

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-all ${isActive ? 'text-teal-600 scale-110' : 'text-slate-900'}`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">{displayLabel}</span>
            </button>
          );
        })}
        {/* Settings Button for Mobile */}
        <button
          onClick={() => handleNavClick(ViewMode.SETTINGS)}
          className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-all ${currentView === ViewMode.SETTINGS ? 'text-teal-600 scale-110' : 'text-slate-900'}`}
        >
          <Icons.Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">Settings</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;