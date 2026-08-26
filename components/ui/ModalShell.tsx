import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from './Icons';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ComponentType<{ className?: string }> | any;
  iconBgColor?: string; // e.g. 'bg-teal-100 text-teal-700'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string; // Container className override
  bodyClassName?: string; // Body wrapper padding/scrolling overrides
  showCloseButton?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconBgColor = 'bg-teal-100 text-teal-700',
  size = 'lg',
  children,
  footerActions,
  headerActions,
  className = "",
  bodyClassName = "",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 350
          }}
          className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 z-10 ${sizeClasses[size]} ${className}`}
        >
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center min-w-0">
                {Icon && (
                  <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${iconBgColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {title}
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {headerActions}
                {showCloseButton && (
                  <button 
                    onClick={onClose} 
                    aria-label="Close modal"
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <Icons.Close className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className={`flex-1 overflow-y-auto custom-scrollbar ${bodyClassName}`}>
            {children}
          </div>

          {/* Footer */}
          {footerActions && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3 flex-shrink-0">
              {footerActions}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ModalShell;
