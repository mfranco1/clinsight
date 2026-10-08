import { useCallback, useState, type DragEvent } from "react";

interface UseFileDropOptions {
  enabled?: boolean;
  onFilesDrop: (files: FileList | File[]) => void;
}

export const useFileDrop = ({
  enabled = true,
  onFilesDrop,
}: UseFileDropOptions) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (enabled) setIsDragging(true);
    },
    [enabled],
  );

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (enabled && event.dataTransfer.files.length > 0) {
        onFilesDrop(event.dataTransfer.files);
      }
    },
    [enabled, onFilesDrop],
  );

  return { isDragging, onDragOver, onDragLeave, onDrop };
};
