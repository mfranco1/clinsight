import { useState, useCallback, useEffect, useRef } from "react";
import { FileUpload, PhotoCategory } from "../types";
import { createFileUploads, revokeUrl } from "../services/fileService";

/**
 * Custom hook to manage file uploads and their lifecycle
 */
export const useFileUpload = (initialFiles: FileUpload[] = []) => {
  const [files, setFiles] = useState<FileUpload[]>(initialFiles);
  const filesRef = useRef(files);
  filesRef.current = files;

  // Cleanup only the URLs still owned by this hook when its owner unmounts.
  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        if (file.previewUrl) {
          revokeUrl(file.previewUrl);
        }
      });
    };
  }, []);

  const addFiles = useCallback(
    async (newFiles: FileList | File[], category?: PhotoCategory) => {
      const processedFiles = await createFileUploads(newFiles, category);
      setFiles((prev) => [...prev, ...processedFiles]);
      return processedFiles;
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.previewUrl) {
        revokeUrl(removed.previewUrl);
      }
      return newFiles;
    });
  }, []);

  const clear = useCallback(() => {
    filesRef.current.forEach((file) => {
      if (file.previewUrl) {
        revokeUrl(file.previewUrl);
      }
    });
    setFiles([]);
  }, []);

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    clear,
  };
};
