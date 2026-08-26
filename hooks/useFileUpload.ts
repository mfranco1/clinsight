import { useState, useCallback, useEffect } from 'react';
import { FileUpload, PhotoCategory } from '../types';
import { createFileUpload, revokeUrl } from '../services/fileService';

/**
 * Custom hook to manage file uploads and their lifecycle
 */
export const useFileUpload = (initialFiles: FileUpload[] = []) => {
  const [files, setFiles] = useState<FileUpload[]>(initialFiles);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          revokeUrl(file.previewUrl);
        }
      });
    };
  }, [files]);

  const addFiles = useCallback(async (newFiles: FileList | File[], category?: PhotoCategory) => {
    const filesArray = Array.from(newFiles);
    const processedFiles = await Promise.all(
      filesArray.map(file => createFileUpload(file, category))
    );
    setFiles(prev => [...prev, ...processedFiles]);
    return processedFiles;
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.previewUrl) {
        revokeUrl(removed.previewUrl);
      }
      return newFiles;
    });
  }, []);

  const clear = useCallback(() => {
    files.forEach(file => {
      if (file.previewUrl) {
        revokeUrl(file.previewUrl);
      }
    });
    setFiles([]);
  }, [files]);

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    clear
  };
};
