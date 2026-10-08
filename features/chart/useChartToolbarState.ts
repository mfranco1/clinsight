import { useEffect, useRef, useState } from "react";

export function useChartToolbarState() {
  const menuRef = useRef<HTMLDivElement>(null);
  const manageRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        manageRef.current &&
        !manageRef.current.contains(event.target as Node)
      ) {
        setIsManageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    menuRef,
    manageRef,
    isMenuOpen,
    setIsMenuOpen,
    isManageOpen,
    setIsManageOpen,
    isHistoryCollapsed,
    setIsHistoryCollapsed,
    isMobileHistoryOpen,
    setIsMobileHistoryOpen,
  };
}
