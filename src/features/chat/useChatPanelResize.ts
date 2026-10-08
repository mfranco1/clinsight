import { useCallback, useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export const useChatPanelResize = () => {
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const startResizing = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (event: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - event.clientX;
      if (newWidth > 300 && newWidth < Math.min(800, window.innerWidth * 0.8)) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resize, stopResizing]);

  return { sidebarWidth, isDesktop, startResizing };
};
