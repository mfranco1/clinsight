import { useCallback, useState } from "react";
import { ChartEntry, SoapNote } from "../../types";
import {
  analyzeClinicalPhotos,
  analyzeImagingPhotos,
  analyzeLabPhotos,
} from "../../services/ai/actions";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { keyValueToString, stringToKeyValue } from "../../utils/clinicalText";
import { arrayToMarkdownBullets } from "../../utils/markdown";

interface UseChartPhotoAnalysisOptions {
  activeEntry: ChartEntry;
  onUpdate?: (soap: SoapNote) => void;
  setWorkflowError: (message: string) => void;
}

export function useChartPhotoAnalysis({
  activeEntry,
  onUpdate,
  setWorkflowError,
}: UseChartPhotoAnalysisOptions) {
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [isAnalyzingLabs, setIsAnalyzingLabs] = useState(false);
  const [isAnalyzingImaging, setIsAnalyzingImaging] = useState(false);

  const analyzePhotos = useCallback(async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0)
      return;

    setIsAnalyzingPhotos(true);
    try {
      const files = activeEntry.attachments.map(
        (attachment) => attachment.file,
      );
      const currentPhysicalExam = keyValueToString(
        activeEntry.soap?.objective.physicalExam,
      );
      const updatedPhysicalExam = await analyzeClinicalPhotos(
        files,
        currentPhysicalExam,
      );
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: {
            ...activeEntry.soap.objective,
            physicalExam: stringToKeyValue(updatedPhysicalExam),
          },
        });
      }
    } catch {
      logDiagnostic("error", "Clinical photo analysis failed.");
      setWorkflowError("Failed to analyze clinical photos. Please try again.");
    } finally {
      setIsAnalyzingPhotos(false);
    }
  }, [activeEntry, onUpdate, setWorkflowError]);

  const analyzeLabs = useCallback(async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0)
      return;
    const labPhotos = activeEntry.attachments.filter(
      (attachment) => attachment.category === "Laboratory",
    );
    if (labPhotos.length === 0) {
      setWorkflowError("No laboratory photos found to analyze.");
      return;
    }

    setIsAnalyzingLabs(true);
    try {
      const files = labPhotos.map((attachment) => attachment.file);
      const currentLabs = activeEntry.soap?.objective.labs || "";
      const currentInterpretation = arrayToMarkdownBullets(
        activeEntry.soap?.objective.labInterpretation,
      );
      const { labs, labInterpretation } = await analyzeLabPhotos(
        files,
        currentLabs,
        currentInterpretation,
      );
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: { ...activeEntry.soap.objective, labs, labInterpretation },
        });
      }
    } catch {
      logDiagnostic("error", "Lab photo analysis failed.");
      setWorkflowError(
        "Failed to analyze laboratory photos. Please try again.",
      );
    } finally {
      setIsAnalyzingLabs(false);
    }
  }, [activeEntry, onUpdate, setWorkflowError]);

  const analyzeImaging = useCallback(async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0)
      return;
    const imagingPhotos = activeEntry.attachments.filter(
      (attachment) => attachment.category === "Imaging",
    );
    if (imagingPhotos.length === 0) {
      setWorkflowError("No imaging photos found to analyze.");
      return;
    }

    setIsAnalyzingImaging(true);
    try {
      const files = imagingPhotos.map((attachment) => attachment.file);
      const currentImaging = activeEntry.soap?.objective.imaging || "";
      const currentCorrelation = arrayToMarkdownBullets(
        activeEntry.soap?.objective.imagingCorrelation,
      );
      const { imaging, imagingCorrelation } = await analyzeImagingPhotos(
        files,
        currentImaging,
        currentCorrelation,
      );
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: {
            ...activeEntry.soap.objective,
            imaging,
            imagingCorrelation,
          },
        });
      }
    } catch {
      logDiagnostic("error", "Imaging photo analysis failed.");
      setWorkflowError("Failed to analyze imaging photos. Please try again.");
    } finally {
      setIsAnalyzingImaging(false);
    }
  }, [activeEntry, onUpdate, setWorkflowError]);

  return {
    isAnalyzingPhotos,
    isAnalyzingLabs,
    isAnalyzingImaging,
    analyzePhotos,
    analyzeLabs,
    analyzeImaging,
  };
}
