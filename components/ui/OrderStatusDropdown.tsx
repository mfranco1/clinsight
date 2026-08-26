import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OrderStatus } from '../../types';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';

interface OrderStatusDropdownProps {
  status: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
  isDesktop?: boolean;
  className?: string;
}

export const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-slate-50 text-slate-700 border-slate-200';
    case OrderStatus.ONGOING: return 'bg-blue-50 text-blue-700 border-blue-200';
    case OrderStatus.DONE: return 'bg-teal-50 text-teal-700 border-teal-200';
    case OrderStatus.DEFERRED: return 'bg-amber-50 text-amber-700 border-amber-200';
    case OrderStatus.FAILED: return 'bg-rose-50 text-rose-700 border-rose-200';
    case OrderStatus.WAITING: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case OrderStatus.PAUSED: return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

const OrderStatusDropdown: React.FC<OrderStatusDropdownProps> = ({
  status,
  onChange,
  isDesktop = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 160; // w-40 is 160px
        const padding = 10;
        
        let left = rect.left + window.scrollX;
        
        // On mobile or if passed as not desktop, adjust left to prevent overflow
        if (!isDesktop) {
          if (left + dropdownWidth > window.innerWidth - padding) {
            left = window.innerWidth - dropdownWidth - padding;
          }
          if (left < padding) left = padding;
        }

        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: left,
          width: rect.width
        });
      }
    };

    updatePosition();

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all shadow-sm w-full min-w-[80px] ${getStatusColor(status)}`}
      >
        <span className="truncate">{status}</span>
        <Icons.ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-[105]" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  position: 'absolute',
                  top: dropdownPosition.top,
                  left: isDesktop ? dropdownPosition.left + dropdownPosition.width / 2 : dropdownPosition.left,
                  transform: isDesktop ? 'translateX(-50%)' : 'none',
                }}
                className="w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-[110] overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {Object.values(OrderStatus).map((s) => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(s);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        status === s 
                          ? 'bg-teal-50 text-teal-700' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {s}
                      {status === s && <Icons.Check className="w-3 h-3 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default OrderStatusDropdown;
