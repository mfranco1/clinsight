import { useState } from "react";

export function useChartToolbarState() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  return {
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
