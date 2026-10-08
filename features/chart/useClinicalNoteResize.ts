import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";

const MIN_NOTE_HEIGHT = 150;
const MAX_VIEWPORT_RATIO = 0.8;

export function useClinicalNoteResize(initialHeight = 300) {
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (event: globalThis.MouseEvent) => {
      if (!isResizing) return;
      const nextHeight = window.innerHeight - event.clientY;
      if (
        nextHeight > MIN_NOTE_HEIGHT &&
        nextHeight < window.innerHeight * MAX_VIEWPORT_RATIO
      ) {
        setHeight(nextHeight);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return { height, isResizing, startResizing };
}
