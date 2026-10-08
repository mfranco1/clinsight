import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { PortalDropdownPosition } from "../../hooks/usePortalDropdownPosition";

interface PortalMenuProps {
  isOpen: boolean;
  isDesktop: boolean;
  position: PortalDropdownPosition;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Shared portal/backdrop/animation shell for viewport-positioned popover menus. */
const PortalMenu: React.FC<PortalMenuProps> = ({
  isOpen,
  isDesktop,
  position,
  onClose,
  children,
  className = "w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-[110] overflow-hidden",
}) =>
  createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[105]"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              position: "absolute",
              top: position.top,
              left: isDesktop
                ? position.left + position.width / 2
                : position.left,
              transform: isDesktop ? "translateX(-50%)" : "none",
            }}
            className={className}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );

export default PortalMenu;
