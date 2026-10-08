import BrandName from "./components/brand/BrandName";
import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./app/shell/Sidebar";
import Header from "./app/shell/Header";
import PatientHeader from "./app/shell/PatientHeader";
import type InputSectionComponent from "./features/input/InputSection";
import type SoapViewComponent from "./features/chart/SoapView";
import type CourseViewComponent from "./features/course/CourseView";
import type SummaryViewComponent from "./features/handoff/SummaryView";
import type NotesViewComponent from "./features/notes/NotesView";
import type OrdersViewComponent from "./features/orders/OrdersView";
import type ProfileViewComponent from "./features/profile/ProfileView";
import type SettingsViewComponent from "./features/settings/SettingsView";
import type LoginPageComponent from "./features/access/LoginPage";
import type ChatPanelComponent from "./features/chat/ChatPanel";
import type PrivacyPolicyModalComponent from "./components/PrivacyPolicyModal";
import type TermsOfServiceModalComponent from "./components/TermsOfServiceModal";
import { createLazyFeature } from "./components/ui/LazyFeature";
import {
  LoadingScreen,
  SkeletonSection,
} from "./components/ui/LoadingFeedback";
import LoadingOverlay from "./components/LoadingOverlay";
import Toast from "./components/Toast";
import { Icons } from "./components/ui/Icons";
import DashboardView from "./features/dashboard/DashboardView";
import {
  MedicalChartResponse,
  ViewMode,
  FileUpload,
  SoapNote,
  GeneralData,
  ChartEntry,
  HandoffSummary,
  PatientNote,
  PatientOrder,
  MedicationOrder,
  PatientStatus,
  EncounterType,
  DeceasedInfo,
  CauseOfDeath,
  GroundingSource,
  CourseEvent,
} from "./types";
import { useFileUpload } from "./hooks/useFileUpload";
import { usePatientStore } from "./hooks/usePatientStore";
import { geminiGateway } from "./services/ai/geminiGateway";
import {
  requestNotificationPermission,
  sendNotification,
} from "./services/notificationService";
import { DEFAULT_MODEL } from "./config/appConfig";
import { getErrorMessageCompat } from "./services/appErrors";
import {
  getTodayLocalDateString,
  getTodayDate,
  getCurrentTime24,
  getLocalDateTimeParts,
  normalizeDateInput,
} from "./utils/date";
import { createId } from "./utils/ids";
import { safeStorage } from "./utils/storage";
import { normalizePatientAgeSex } from "./utils/patient";
import {
  loadPersistedPatients,
  PATIENTS_STORAGE_KEY,
} from "./services/patientPersistence";
import {
  appendAssessedEntry,
  appendCourseEvent,
  applyEntryReassessment,
  prependEntryWithCourseEvent,
  prependNote,
  reactivateEncounter,
  removeEntry,
  updateCourse,
  updateEntry,
  updateEntrySoap,
  updateHandoff,
  updateMedications,
  updateNotes,
  updateOrder,
  updateOrders,
  updatePatientInfo,
  updatePatientStatus,
  withPatientId,
} from "./domain/patientTransitions";
import {
  createGeneratedPatient,
  createManualPatient,
} from "./domain/patientFactories";
import { carryOverUndoneOrderDates } from "./domain/orders";
import {
  collectAttachmentPreviewUrls,
  hydrateAttachments,
  serializeAttachments,
} from "./services/attachmentPersistence";
import { logDiagnostic } from "./services/diagnosticLogger";
import { useViewStateCache } from "./app/ViewState";

function ViewLoadingFallback({ title }: { title: string }) {
  return (
    <section className="mx-auto w-full max-w-7xl p-4 md:p-6" aria-busy="true">
      <h1 className="mb-5 text-lg font-semibold text-content-strong">
        {title}
      </h1>
      <SkeletonSection rows={4} />
      <SkeletonSection titleWidth="w-32" rows={2} />
      <span className="sr-only" role="status" aria-live="polite">
        Loading {title.toLowerCase()}…
      </span>
    </section>
  );
}

const InputSection = createLazyFeature<
  React.ComponentProps<typeof InputSectionComponent>
>(
  () => import("./features/input/InputSection"),
  <ViewLoadingFallback title="Patient intake" />,
);
const SoapView = createLazyFeature<
  React.ComponentProps<typeof SoapViewComponent>
>(
  () => import("./features/chart/SoapView"),
  <ViewLoadingFallback title="Patient chart" />,
);
const CourseView = createLazyFeature<
  React.ComponentProps<typeof CourseViewComponent>
>(
  () => import("./features/course/CourseView"),
  <ViewLoadingFallback title="Course" />,
);
const SummaryView = createLazyFeature<
  React.ComponentProps<typeof SummaryViewComponent>
>(
  () => import("./features/handoff/SummaryView"),
  <ViewLoadingFallback title="Handoff" />,
);
const NotesView = createLazyFeature<
  React.ComponentProps<typeof NotesViewComponent>
>(
  () => import("./features/notes/NotesView"),
  <ViewLoadingFallback title="Notes" />,
);
const OrdersView = createLazyFeature<
  React.ComponentProps<typeof OrdersViewComponent>
>(
  () => import("./features/orders/OrdersView"),
  <ViewLoadingFallback title="Orders" />,
);
const ProfileView = createLazyFeature<
  React.ComponentProps<typeof ProfileViewComponent>
>(
  () => import("./features/profile/ProfileView"),
  <ViewLoadingFallback title="Patient profile" />,
);
const SettingsView = createLazyFeature<
  React.ComponentProps<typeof SettingsViewComponent>
>(
  () => import("./features/settings/SettingsView"),
  <ViewLoadingFallback title="Settings" />,
);
const LoginPage = createLazyFeature<
  React.ComponentProps<typeof LoginPageComponent>
>(
  () => import("./features/access/LoginPage"),
  <LoadingScreen label="Loading sign in…" />,
);
const ChatPanel = createLazyFeature<
  React.ComponentProps<typeof ChatPanelComponent>
>(() => import("./features/chat/ChatPanel"));
const PrivacyPolicyModal = createLazyFeature<
  React.ComponentProps<typeof PrivacyPolicyModalComponent>
>(
  () => import("./components/PrivacyPolicyModal"),
  <LoadingScreen label="Loading privacy policy…" />,
);
const TermsOfServiceModal = createLazyFeature<
  React.ComponentProps<typeof TermsOfServiceModalComponent>
>(
  () => import("./components/TermsOfServiceModal"),
  <LoadingScreen label="Loading terms…" />,
);

function App() {
  const viewStateCache = useViewStateCache();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const {
    files: inputFiles,
    setFiles: setInputFiles,
    addFiles: addInputFiles,
    removeFile: removeInputFile,
    clear: clearInputFiles,
  } = useFileUpload();
  const [inputText, setInputText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReassessing, setIsReassessing] = useState<boolean>(false);

  // Multi-patient state
  const {
    patients,
    updatePatients,
    addPatient,
    addPatients,
    updatePatient,
    removePatient,
  } = usePatientStore(() =>
    loadPersistedPatients(safeStorage.getItem(PATIENTS_STORAGE_KEY)),
  );
  const patientPreviewUrls = useRef<Set<string>>(new Set());
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [defaultModel, setDefaultModel] = useState<string>(
    () => safeStorage.getItem("clinsight_default_model") || DEFAULT_MODEL,
  );
  const [defaultSpecialization, setDefaultSpecialization] = useState<string>(
    () =>
      safeStorage.getItem("clinsight_default_specialization") ||
      "General Practice",
  );
  const [model, setModel] = useState<string>(defaultModel);
  const [specialization, setSpecialization] = useState<string>(
    defaultSpecialization,
  );

  // Derived active patient
  const activePatient = patients.find((p) => p.id === activePatientId) || null;

  const updateActivePatient = (
    update: (patient: MedicalChartResponse) => MedicalChartResponse,
  ) => {
    if (activePatientId) updatePatient(activePatientId, update);
  };

  // Persistence: Save to localStorage whenever patients change
  useEffect(() => {
    safeStorage.setItem(
      PATIENTS_STORAGE_KEY,
      JSON.stringify(serializeAttachments(patients)),
    );
  }, [patients]);

  useEffect(() => {
    const nextUrls = collectAttachmentPreviewUrls(patients);
    patientPreviewUrls.current.forEach((url) => {
      if (!nextUrls.has(url)) URL.revokeObjectURL(url);
    });
    patientPreviewUrls.current = nextUrls;
  }, [patients]);

  useEffect(
    () => () => {
      patientPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      patientPreviewUrls.current.clear();
    },
    [],
  );

  // Carry over undone orders for all patients
  useEffect(() => {
    const updatedPatients = carryOverUndoneOrderDates(
      patients,
      getTodayLocalDateString(),
      new Date(),
    );
    if (updatedPatients !== patients) updatePatients(() => updatedPatients);
  }, [patients]);

  useEffect(() => {
    safeStorage.setItem("clinsight_default_model", defaultModel);
    setModel(defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    safeStorage.setItem(
      "clinsight_default_specialization",
      defaultSpecialization,
    );
    setSpecialization(defaultSpecialization);
  }, [defaultSpecialization]);

  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasChatMounted, setHasChatMounted] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<number>(0);

  // Legal Modals State
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [hasPrivacyMounted, setHasPrivacyMounted] = useState(false);
  const [hasTermsMounted, setHasTermsMounted] = useState(false);

  // Summary Refresh State
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);

  // Close chat and reset session when active patient changes or is cleared
  useEffect(() => {
    setIsChatOpen(false);
    setChatSessionId((prev) => prev + 1);
  }, [activePatientId]);

  // Ref to track the current generation request ID to handle cancellations
  const generationRequestId = useRef<number>(0);

  // Ref for the main scrollable container
  const mainContentRef = useRef<HTMLElement>(null);
  const viewScrollPositions = useRef(
    new Map<string, { main: number; nested: number[] }>(),
  );
  const scrollKey = `${currentView}:${activePatientId ?? "none"}:${currentView === ViewMode.CHART ? (activeEntryId ?? "none") : ""}`;

  const [showMobileNav, setShowMobileNav] = useState(true);
  const lastScrollY = useRef(0);

  // Handle mobile nav visibility on scroll
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || target.scrollTop === undefined) return;

      // Check if the target is the main container or an internal main scroll container
      const isMainContent = target === mainContentRef.current;
      const isInternalScroll = target.classList.contains(
        "main-scroll-container",
      );

      if (!isMainContent && !isInternalScroll) return;

      const currentScrollY = target.scrollTop;
      const positions = viewScrollPositions.current.get(scrollKey) ?? {
        main: mainContentRef.current?.scrollTop ?? 0,
        nested: [],
      };
      if (isMainContent) positions.main = currentScrollY;
      else {
        const nested = Array.from(
          mainContentRef.current?.querySelectorAll<HTMLElement>(
            ".main-scroll-container",
          ) ?? [],
        );
        positions.nested[nested.indexOf(target)] = currentScrollY;
      }
      viewScrollPositions.current.set(scrollKey, positions);

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowMobileNav(false);
      } else {
        setShowMobileNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    // Use capture to catch scroll events from children (since scroll doesn't bubble)
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [currentView, activePatientId, activeEntryId, scrollKey]);

  // Restore a view's scroll position after navigation; first visits begin at the top.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const main = mainContentRef.current;
      if (main) {
        const positions = viewScrollPositions.current.get(scrollKey);
        main.scrollTop = positions?.main ?? 0;
        const nested = main.querySelectorAll<HTMLElement>(
          ".main-scroll-container",
        );
        nested.forEach((element, index) => {
          element.scrollTop = positions?.nested[index] ?? 0;
        });
      }
      lastScrollY.current = 0;
      setShowMobileNav(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollKey]);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Handle active patient deactivation when navigating to non-patient views
  useEffect(() => {
    const patientSpecificViews = [
      ViewMode.PROFILE,
      ViewMode.CHART,
      ViewMode.COURSE,
      ViewMode.HANDOFF,
      ViewMode.ORDERS,
      ViewMode.NOTES,
      ViewMode.APPEND_ENTRY,
    ];

    if (!patientSpecificViews.includes(currentView)) {
      setActivePatientId(null);
      setActiveEntryId(null);
    }
  }, [currentView]);

  const handleNavigate = (view: ViewMode) => {
    const main = mainContentRef.current;
    if (main) {
      const positions = viewScrollPositions.current.get(scrollKey) ?? {
        main: main.scrollTop,
        nested: [],
      };
      positions.main = main.scrollTop;
      main
        .querySelectorAll<HTMLElement>(".main-scroll-container")
        .forEach((element, index) => {
          positions.nested[index] = element.scrollTop;
        });
      viewScrollPositions.current.set(scrollKey, positions);
    }
    const patientSpecificViews = [
      ViewMode.PROFILE,
      ViewMode.CHART,
      ViewMode.COURSE,
      ViewMode.HANDOFF,
      ViewMode.ORDERS,
      ViewMode.NOTES,
      ViewMode.APPEND_ENTRY,
    ];

    if (!patientSpecificViews.includes(view)) {
      setActivePatientId(null);
      setActiveEntryId(null);
      if (view === ViewMode.INPUT) {
        setSpecialization(defaultSpecialization);
        setModel(defaultModel);
      }
    }
    setCurrentView(view);
  };

  const handleGenerate = async (isConsultBase: boolean = false) => {
    const requestId = Date.now();
    generationRequestId.current = requestId;

    setIsGenerating(true);
    setError(null);

    try {
      const filesToUpload = inputFiles.map((f) => f.file);

      if (activePatient) {
        // Progress Note flow
        const result = await geminiGateway.generateProgressNote({
          text: inputText,
          files: filesToUpload,
          model,
          specialization,
          useSearch: true,
          history: activePatient.entries,
        });

        if (generationRequestId.current === requestId) {
          const newEntryId = createId("entry");
          const { date: currentSystemDate, time: currentSystemTime } =
            getLocalDateTimeParts();

          const finalDate = result.inferredDate
            ? normalizeDateInput(result.inferredDate) || currentSystemDate
            : currentSystemDate;
          const finalTime = result.inferredTime
            ? result.inferredTime
            : currentSystemTime;
          const effectiveDate = `${finalDate} ${finalTime}`;

          const activeEncounter = activePatient.encounters?.find(
            (e) => e.status === "ACTIVE",
          );
          const isConsult = activeEncounter?.type === EncounterType.CONSULT;
          const isFirstEntryInEncounter = !activePatient.entries?.some(
            (e) => e.encounterId === activeEncounter?.id,
          );
          const finalTitle = isConsult
            ? "Consult Note"
            : isFirstEntryInEncounter
              ? "Admission Note"
              : "Progress Note";

          const newEntry: ChartEntry = {
            id: newEntryId,
            encounterId: activeEncounter?.id,
            date: effectiveDate,
            title: finalTitle,
            type: "SOAP",
            entryType: "structured",
            soap: result.soap,
            originalNote: inputText,
            specialization: specialization,
            attachments: [...inputFiles],
            references: result.references,
            groundingSources: result.groundingSources,
          };

          const newCourseEvent = {
            encounterId: activeEncounter?.id,
            date: finalDate,
            time: finalTime,
            event: isFirstEntryInEncounter
              ? finalTitle
              : result.courseEvent.event,
            details: result.courseEvent.details,
          };

          updatePatient(activePatient.id, (p) =>
            prependEntryWithCourseEvent(p, newEntry, newCourseEvent),
          );

          setActiveEntryId(newEntryId);
          handleNavigate(ViewMode.CHART);
          setChatSessionId((prev) => prev + 1);

          sendNotification(
            isFirstEntryInEncounter
              ? isConsult
                ? "Consult Note Generated"
                : "Admission Note Generated"
              : "Progress Note Generated",
            {
              body: `A new ${isFirstEntryInEncounter ? (isConsult ? "consult" : "admission") : "progress"} note has been added for ${activePatient.patientInfo.patientName}.`,
              tag: "chart-generation",
            },
          );

          setInputText("");
          clearInputFiles();
        }
      } else {
        // Admission Note flow
        const data = await geminiGateway.generateChart({
          text: inputText,
          files: filesToUpload,
          model,
          specialization,
          useSearch: true,
          history: [],
          currentPatientInfo: null,
        });

        if (generationRequestId.current === requestId) {
          const newEntryId = createId("entry");

          // Helper to ensure yyyy-mm-dd format
          const toYYYYMMDD = (dateStr: string | undefined | null): string => {
            if (!dateStr || dateStr.toLowerCase() === "not recorded")
              return "Not Recorded";
            return normalizeDateInput(dateStr) || dateStr;
          };

          const getTodayISO = () => getTodayDate();
          const getNowTime24 = () => getCurrentTime24();

          const rawAdmissionDate = data.patientInfo.admissionDate;
          const isAdmissionMissing =
            !rawAdmissionDate ||
            rawAdmissionDate.toLowerCase() === "not recorded";

          // Ensure date defaults to today if "Not Recorded" is returned from the analysis
          const effectiveDate = isAdmissionMissing
            ? `${getTodayISO()} ${getNowTime24()}`
            : `${toYYYYMMDD(rawAdmissionDate)} ${getNowTime24()}`;

          // Normalize Patient Info dates for the Face Sheet
          data.patientInfo.dob = toYYYYMMDD(data.patientInfo.dob);

          // Normalize course event dates
          if (data.course) {
            data.course = data.course.map((ev) => ({
              ...ev,
              encounterId: newEntryId,
              date:
                toYYYYMMDD(ev.date) === "Not Recorded"
                  ? getTodayISO()
                  : toYYYYMMDD(ev.date),
              time: ev.time || getNowTime24(),
            }));
          }

          if (data.orders) {
            data.orders = data.orders.map((o) => ({
              ...o,
              encounterId: newEntryId,
            }));
          }

          data.patientInfo.admissionDate = effectiveDate;

          const isConsult = isConsultBase;

          const newEntry: ChartEntry = {
            id: newEntryId,
            encounterId: newEntryId, // Using newEntryId as encounterId for simplicity
            date: effectiveDate,
            title: isConsult ? "Consult Note" : "Admission Note",
            type: "SOAP",
            entryType: "structured",
            soap: data.soap,
            originalNote: inputText,
            specialization: specialization,
            attachments: [...inputFiles],
            references: data.references,
            groundingSources: data.groundingSources,
          };

          const newCourseEvent = {
            encounterId: newEntryId,
            date: getTodayISO(),
            time: getNowTime24(),
            event: isConsult ? "Start Consult" : "Admission",
            details: `Patient registered under ${specialization}`,
          };

          const newPatient = {
            ...createGeneratedPatient(data, {
              entry: newEntry,
              encounterId: newEntryId,
              effectiveDate,
              isConsult,
              fallbackCourseEvent: newCourseEvent,
            }),
            patientInfo: normalizePatientAgeSex({
              ...data.patientInfo,
              status: isConsult
                ? PatientStatus.OUTPATIENT
                : PatientStatus.ADMITTED,
            }),
          };
          addPatient(newPatient);
          setActivePatientId(newPatient.id);

          setActiveEntryId(newEntryId);
          handleNavigate(ViewMode.CHART);
          setChatSessionId((prev) => prev + 1);

          sendNotification("Chart Generated", {
            body: `The ${isConsult ? "Consult" : "Admission"} Note for ${newPatient.patientInfo.patientName} is ready.`,
            tag: "chart-generation",
          });

          setInputText("");
          clearInputFiles();
        }
      }
    } catch (err: unknown) {
      if (generationRequestId.current === requestId) {
        logDiagnostic("error", "Chart generation failed.");
        setError(
          getErrorMessageCompat(
            err,
            "An unexpected error occurred while generating the chart. Please try again.",
          ),
        );
      }
    } finally {
      if (generationRequestId.current === requestId) {
        setIsGenerating(false);
      }
    }
  };

  const handleSaveRawEntry = (isConsultBase: boolean = false) => {
    if (!inputText.trim()) return;

    const newEntryId = Date.now().toString();
    const now = new Date();
    const today = now.toLocaleDateString("en-CA");
    const time = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const isFirstEntry = !activePatient;
    const activeEnc = activePatient?.encounters?.find(
      (e) => e.status === "ACTIVE",
    );
    const isConsult = isFirstEntry
      ? isConsultBase
      : activeEnc?.type === EncounterType.CONSULT;
    const isFirstEntryInEncounter = activePatient
      ? !activePatient.entries?.some((e) => e.encounterId === activeEnc?.id)
      : true;
    const finalTitle = isConsult
      ? "Consult Note"
      : isFirstEntry || isFirstEntryInEncounter
        ? "Admission Note"
        : "Progress Note";
    const finalType = isConsult
      ? "Consult"
      : isFirstEntry || isFirstEntryInEncounter
        ? "Admission"
        : "Progress";

    const newEntry: ChartEntry = {
      id: newEntryId,
      encounterId: activeEnc?.id,
      date: `${today} ${time}`,
      title: finalTitle,
      type: finalType,
      entryType: "raw",
      rawText: inputText,
      originalNote: inputText,
      specialization: specialization,
      attachments: [...inputFiles],
    };

    const newEvent = {
      date: today,
      time: time,
      event: finalTitle,
      details:
        inputText.substring(0, 200) + (inputText.length > 200 ? "..." : ""),
    };

    if (isFirstEntry) {
      // Initialize new chart with placeholder patient info
      const newPatientId = createId();
      const encounterId = createId();
      const now = new Date().toISOString();

      const newEventWithEncounter = {
        ...newEvent,
        encounterId,
      };

      const manualPatient = createManualPatient({
        id: newPatientId,
        encounterId,
        now,
        today,
        isConsult,
        entry: newEntry,
        courseEvent: newEventWithEncounter,
      });
      const newPatient: MedicalChartResponse = {
        ...manualPatient,
        patientInfo: normalizePatientAgeSex(manualPatient.patientInfo),
      };
      addPatient(newPatient);
      setActivePatientId(newPatientId);
    } else {
      const activeEnc = activePatient?.encounters?.find(
        (e) => e.status === "ACTIVE",
      );
      const newEventWithEncounter = {
        ...newEvent,
        encounterId: activeEnc?.id,
      };

      updateActivePatient((p) =>
        prependEntryWithCourseEvent(p, newEntry, newEventWithEncounter, false),
      );
    }

    setActiveEntryId(newEntryId);
    handleNavigate(ViewMode.CHART);
    setInputText("");
    clearInputFiles();

    sendNotification("Manual Note Saved", {
      body: `A manual ${isFirstEntry || isFirstEntryInEncounter ? (isConsult ? "consult" : "admission") : "progress"} note has been saved.`,
      tag: "manual-note",
    });
  };

  const handleReassess = async () => {
    if (!activePatient || !activeEntryId || isReassessing) return;

    const activeEntry = activePatient.entries.find(
      (e) => e.id === activeEntryId,
    );
    if (!activeEntry || !activeEntry.soap) return;

    setIsReassessing(true);
    setError(null);

    try {
      // Get the most recent 2 historical entries
      const recentHistory = activePatient.entries
        .filter((e) => e.id !== activeEntryId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

      // Always use search grounding
      const result = await geminiGateway.reassessNote({
        soap: activeEntry.soap,
        history: recentHistory,
        model,
        specialization,
        useSearch: true,
      });

      updateActivePatient((p) =>
        applyEntryReassessment(p, activeEntryId, {
          assessment: result.assessment,
          plan: result.plan,
          references: result.references,
          groundingSources: result.groundingSources,
        }),
      );

      // Send notification
      sendNotification("Reassessment Complete", {
        body: `The SOAP note reassessment for ${activePatient?.patientInfo.patientName || "the patient"} is finished.`,
        tag: "reassessment",
      });
    } catch (err: unknown) {
      logDiagnostic("error", "SOAP reassessment failed.");
      setError(
        getErrorMessageCompat(
          err,
          "Failed to reassess the patient based on current data.",
        ),
      );
    } finally {
      setIsReassessing(false);
    }
  };

  const handleAssess = async () => {
    if (!activePatient || !activeEntryId || isReassessing) return;

    const activeEntry = activePatient.entries.find(
      (e) => e.id === activeEntryId,
    );
    if (!activeEntry || activeEntry.entryType !== "raw") return;

    setIsReassessing(true);
    setError(null);

    try {
      const rawText = activeEntry.rawText || activeEntry.originalNote || "";

      // Get history up to this entry
      const entryIndex = activePatient.entries.findIndex(
        (e) => e.id === activeEntryId,
      );
      const history = activePatient.entries.slice(entryIndex + 1); // Older entries are after this one in the array (newest first)

      const result = await geminiGateway.generateProgressNote({
        text: rawText,
        files: activeEntry.attachments?.map((a) => a.file) || [],
        model,
        specialization,
        useSearch: true,
        history,
      });

      const getTodayISO = () => getTodayDate();
      const getNowTime24 = () => getCurrentTime24();

      const newCourseEvent = {
        date: activeEntry.date.split(" ")[0] || getTodayISO(),
        time: activeEntry.date.split(" ")[1] || getNowTime24(),
        event: result.courseEvent.event,
        details: result.courseEvent.details,
        encounterId: activeEntry.encounterId,
      };

      updateActivePatient((p) =>
        appendAssessedEntry(
          p,
          activeEntryId,
          result.soap,
          newCourseEvent,
          result.references,
          result.groundingSources,
        ),
      );

      sendNotification("Assessment Complete", {
        body: `The clinical assessment for ${activePatient?.patientInfo.patientName || "the patient"} is finished.`,
        tag: "assessment",
      });
    } catch (err: unknown) {
      logDiagnostic("error", "Clinical assessment failed.");
      setError(
        getErrorMessageCompat(
          err,
          "Failed to generate assessment based on the clinical note.",
        ),
      );
    } finally {
      setIsReassessing(false);
    }
  };

  const handleCancelGeneration = () => {
    generationRequestId.current = 0;
    setIsGenerating(false);
  };

  const handleResetForm = () => {
    setInputText("");
    clearInputFiles();
    setSpecialization(defaultSpecialization);
    setModel(defaultModel);
    setError(null);
  };

  const handleReset = () => {
    handleResetForm();
    viewScrollPositions.current.clear();
    viewStateCache.clear();
    setActivePatientId(null);
    setIsGenerating(false);
    setIsReassessing(false);
    generationRequestId.current = 0;
    handleNavigate(ViewMode.DASHBOARD);
    setIsChatOpen(false);
    setChatSessionId((prev) => prev + 1);
  };

  const handleLogout = () => {
    handleReset();
    setIsLoggedIn(false);
    handleNavigate(ViewMode.LOGIN);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    handleNavigate(ViewMode.DASHBOARD);
  };

  const handleUpdateEntrySoap = (entryId: string, updatedSoap: SoapNote) => {
    updateActivePatient((p) => updateEntrySoap(p, entryId, updatedSoap));
  };

  const handleUpdateEntry = (entryId: string, updatedEntry: ChartEntry) => {
    updateActivePatient((p) => updateEntry(p, entryId, updatedEntry));
  };

  const handleUpdatePatientInfo = (updatedInfo: GeneralData) => {
    updateActivePatient((p) =>
      updatePatientInfo(p, normalizePatientAgeSex(updatedInfo)),
    );
  };

  const handleUpdateCourse = (updatedCourse: CourseEvent[]) => {
    updateActivePatient((p) => updateCourse(p, updatedCourse));
  };

  const handleUpdateHandoff = (updatedHandoff: HandoffSummary) => {
    updateActivePatient((p) => updateHandoff(p, updatedHandoff));
  };

  const handleUpdateOrders = (updatedOrders: PatientOrder[]) => {
    updateActivePatient((p) => updateOrders(p, updatedOrders));
  };

  const handleUpdateMedications = (updatedMeds: MedicationOrder[]) => {
    updateActivePatient((p) => updateMedications(p, updatedMeds));
  };

  const handleRefreshSummary = async () => {
    if (!activePatient || isRefreshingSummary) return;
    setIsRefreshingSummary(true);
    try {
      const recentEntries = activePatient.entries.slice(0, 3);
      const recentCourse = (activePatient.course || []).slice(0, 5);

      const updatedSummary = await geminiGateway.refreshSummary({
        currentSummary: activePatient.handoff,
        patientInfo: activePatient.patientInfo,
        recentEntries,
        recentCourse,
        model,
        specialization,
      });

      handleUpdateHandoff(updatedSummary);
      sendNotification("Summary Updated", {
        body: `The patient summary has been refreshed with the latest clinical data.`,
        tag: "summary-refresh",
      });
    } catch (err: unknown) {
      logDiagnostic("error", "Patient summary refresh failed.");
      setError(
        getErrorMessageCompat(err, "Failed to refresh patient summary."),
      );
    } finally {
      setIsRefreshingSummary(false);
    }
  };

  const handleUpdateNotes = (updatedNotes: PatientNote[]) => {
    updateActivePatient((p) => updateNotes(p, updatedNotes));
  };

  const handleUpdateGlobalOrder = (
    patientId: string,
    updatedOrder: PatientOrder,
  ) => {
    updatePatient(patientId, (p) => updateOrder(p, updatedOrder));
  };

  const handleSaveChatAsNote = (
    content: string,
    groundingSources?: GroundingSource[],
    title?: string,
  ) => {
    if (!activePatientId) return;

    const newNote: PatientNote = {
      id: Date.now().toString(),
      title: title || "Assistant Response",
      content: content,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      isAssistant: true,
      groundingSources: groundingSources,
    };

    updateActivePatient((p) => prependNote(p, newNote));

    sendNotification("Note Saved", {
      body: "The assistant response has been saved to patient notes.",
      tag: "chat-to-note",
    });
  };

  const handleAddCourseEvent = () => {
    if (!activePatientId || !activePatient) return;
    const today = getTodayDate();
    const now = getCurrentTime24();

    // Find active encounter
    const activeEncounter = activePatient.encounters?.find(
      (e) => e.status === "ACTIVE",
    );

    const newEvent = {
      id: createId(),
      encounterId: activeEncounter?.id,
      date: today,
      time: now,
      event: "New Clinical Event",
      details: "Enter clinical details here...",
    };

    updateActivePatient((p) => appendCourseEvent(p, newEvent));
  };

  const handleSelectPatient = (
    id: string,
    initialView: ViewMode = ViewMode.CHART,
  ) => {
    setActivePatientId(id);
    const patient = patients.find((p) => p.id === id);
    if (patient && patient.entries.length > 0) {
      setActiveEntryId(patient.entries[0].id);
    }
    handleNavigate(initialView);
  };

  const handleDeletePatient = (id: string) => {
    removePatient(id);
    viewStateCache.clearPrefix(`patient:${id}:`);
    viewScrollPositions.current.clear();
    if (activePatientId === id) {
      handleNavigate(ViewMode.DASHBOARD);
    }
  };

  const handleUpdatePatientStatus = (
    id: string,
    status: PatientStatus,
    dischargeDateTime?: string,
    deceasedInfo?: DeceasedInfo,
  ) => {
    updatePatient(id, (p) => {
      const now = new Date().toISOString();
      const { date, time } = getLocalDateTimeParts();
      const updated = updatePatientStatus(p, status, {
        now,
        dischargeDateTime:
          dischargeDateTime ||
          (status === PatientStatus.DISCHARGED
            ? `${getTodayDate()} ${getCurrentTime24()}`
            : undefined),
        deceasedInfo,
        nextEncounterId: createId(),
        admissionDateTime: `${date} ${time}`,
      });
      return {
        ...updated,
        patientInfo: normalizePatientAgeSex(updated.patientInfo),
      };
    });
  };

  const handleReactivateEncounter = (id: string, encounterId: string) => {
    updatePatient(id, (p) => {
      const updated = reactivateEncounter(p, encounterId);
      return {
        ...updated,
        patientInfo: normalizePatientAgeSex(updated.patientInfo),
      };
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (!activePatient) return;

    const updatedEntries = activePatient.entries.filter((e) => e.id !== id);

    if (updatedEntries.length === 0) {
      handleDeletePatient(activePatient.id);
      return;
    }

    updateActivePatient((p) => removeEntry(p, id));

    if (activeEntryId === id) {
      setActiveEntryId(updatedEntries[0].id);
    }
  };

  const handleExportCase = (patient: MedicalChartResponse) => {
    const fileName = `Clinsight_Case_${patient.patientInfo.patientName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    const jsonString = JSON.stringify(serializeAttachments(patient), null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCase = (
    data: MedicalChartResponse | MedicalChartResponse[],
  ) => {
    const importedData = hydrateAttachments(data);
    if (Array.isArray(importedData)) {
      if (importedData.length === 0) return;
      if (importedData.length === 1) {
        const singleCase = importedData[0];
        const identifiedCase = singleCase.id
          ? singleCase
          : withPatientId(singleCase, createId());
        addPatient(identifiedCase);
        setActivePatientId(identifiedCase.id);
        if (identifiedCase.entries.length > 0) {
          setActiveEntryId(identifiedCase.entries[0].id);
        }
        handleNavigate(ViewMode.CHART);
        setChatSessionId((prev) => prev + 1);
      } else {
        const processedCases = importedData.map((c) =>
          c.id ? c : withPatientId(c, createId()),
        );
        addPatients(processedCases);
        handleNavigate(ViewMode.DASHBOARD);
        setToast({
          message: `Successfully uploaded ${importedData.length} patient cases`,
          type: "success",
        });
      }
    } else {
      const identifiedCase = importedData.id
        ? importedData
        : withPatientId(importedData, createId());
      addPatient(identifiedCase);
      setActivePatientId(identifiedCase.id);
      if (identifiedCase.entries.length > 0) {
        setActiveEntryId(identifiedCase.entries[0].id);
      }
      handleNavigate(ViewMode.CHART);
      setChatSessionId((prev) => prev + 1);
    }
  };

  if (currentView === ViewMode.LOGIN) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  const activeEntry = activePatient?.entries.find(
    (e) => e.id === activeEntryId,
  );

  return (
    <div className="min-h-screen flex bg-canvas font-sans relative overflow-hidden">
      {isGenerating && <LoadingOverlay onCancel={handleCancelGeneration} />}

      {error && <Toast message={error} onClose={() => setError(null)} />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        showMobileNav={showMobileNav}
      />

      <div
        id="working-view"
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative"
      >
        <div
          className={`md:h-auto md:max-h-none md:opacity-100 md:pointer-events-auto transition-all duration-300 ease-in-out overflow-hidden shrink-0 z-40 bg-surface ${
            showMobileNav
              ? "max-h-[145px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          {activePatient &&
          (currentView === ViewMode.CHART ||
            currentView === ViewMode.COURSE ||
            currentView === ViewMode.HANDOFF ||
            currentView === ViewMode.PROFILE ||
            currentView === ViewMode.APPEND_ENTRY ||
            currentView === ViewMode.NOTES ||
            currentView === ViewMode.ORDERS) ? (
            <PatientHeader
              patientInfo={activePatient.patientInfo}
              activeEncounter={activePatient.encounters?.find(
                (e) => e.status === "ACTIVE",
              )}
              currentView={currentView}
              onNavigate={handleNavigate}
              onExport={() => handleExportCase(activePatient)}
              onBack={() => {
                handleNavigate(ViewMode.DASHBOARD);
              }}
            />
          ) : (
            <Header
              activePatient={
                activePatient
                  ? {
                      name: activePatient.patientInfo.patientName,
                      mrn: activePatient.patientInfo.mrn,
                      ageSex: activePatient.patientInfo.ageSex,
                    }
                  : null
              }
              currentView={currentView}
            />
          )}
        </div>

        <main
          ref={mainContentRef}
          className={`flex-1 bg-canvas/50 flex flex-col min-h-0 relative ${currentView === ViewMode.CHART ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          <div
            className={`flex-1 ${currentView === ViewMode.CHART ? "h-full" : ""}`}
          >
            {currentView === ViewMode.DASHBOARD && (
              <DashboardView
                patients={patients}
                onSelectPatient={handleSelectPatient}
                onUpdatePatientStatus={handleUpdatePatientStatus}
                onDeletePatient={handleDeletePatient}
                onAddPatient={() => {
                  handleNavigate(ViewMode.INPUT);
                }}
                onUpdateOrder={handleUpdateGlobalOrder}
              />
            )}

            {currentView === ViewMode.PROFILE && activePatient && (
              <ProfileView
                patientInfo={activePatient.patientInfo}
                onUpdatePatient={handleUpdatePatientInfo}
                onUpdatePatientStatus={handleUpdatePatientStatus}
                onDeletePatient={handleDeletePatient}
                patientId={activePatient.id}
              />
            )}

            {(currentView === ViewMode.INPUT ||
              currentView === ViewMode.APPEND_ENTRY) && (
              <InputSection
                textInput={inputText}
                setTextInput={setInputText}
                files={inputFiles}
                onAddFiles={addInputFiles}
                onRemoveFile={removeInputFile}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                onReset={handleResetForm}
                onImport={handleImportCase}
                selectedModel={model}
                onModelSelect={setModel}
                selectedSpecialization={specialization}
                onSpecializationSelect={setSpecialization}
                hasExistingData={!!activePatient}
                isAppendMode={currentView === ViewMode.APPEND_ENTRY}
                activePatient={activePatient}
                onCancelAppend={() => handleNavigate(ViewMode.CHART)}
                onSaveRaw={handleSaveRawEntry}
                isFirstEntryInEncounter={
                  activePatient
                    ? !activePatient.entries?.some(
                        (e) =>
                          e.encounterId ===
                          activePatient.encounters?.find(
                            (enc) => enc.status === "ACTIVE",
                          )?.id,
                      )
                    : true
                }
              />
            )}

            {currentView === ViewMode.CHART && activePatient && activeEntry && (
              <SoapView
                key={activePatient.id}
                activeEntry={activeEntry}
                history={activePatient.entries}
                encounters={activePatient.encounters}
                onSelectEntry={setActiveEntryId}
                patientInfo={activePatient.patientInfo}
                patientStatus={activePatient.patientInfo.status}
                onUpdatePatientStatus={(status) =>
                  handleUpdatePatientStatus(activePatient.id, status)
                }
                onReactivateEncounter={(encounterId) =>
                  handleReactivateEncounter(activePatient.id, encounterId)
                }
                selectedModel={model}
                groundingSources={activeEntry.groundingSources}
                references={activeEntry.references}
                onUpdate={(updatedSoap) =>
                  handleUpdateEntrySoap(activeEntryId!, updatedSoap)
                }
                onUpdateEntry={(updatedEntry) =>
                  handleUpdateEntry(updatedEntry.id, updatedEntry)
                }
                onUpdatePatient={handleUpdatePatientInfo}
                onExport={() => handleExportCase(activePatient)}
                onReassess={handleReassess}
                onAssess={handleAssess}
                onAddEntry={() => handleNavigate(ViewMode.APPEND_ENTRY)}
                onDeleteEntry={handleDeleteEntry}
                isReassessing={isReassessing}
                orders={activePatient.orders || []}
                medications={activePatient.medications || []}
                onAddOrder={(newOrder) => {
                  const currentOrders = activePatient.orders || [];
                  const activeEncounter = activePatient.encounters?.find(
                    (e) => e.status === "ACTIVE",
                  );
                  const orderWithEncounter = {
                    ...newOrder,
                    encounterId: activeEncounter?.id,
                  };
                  handleUpdateOrders([orderWithEncounter, ...currentOrders]);
                }}
                onUpdateMedications={handleUpdateMedications}
              />
            )}

            {currentView === ViewMode.COURSE && activePatient && (
              <CourseView
                patientId={activePatient.id}
                events={activePatient.course}
                encounters={activePatient.encounters}
                onUpdateEvents={(updatedCourse) =>
                  handleUpdateCourse(updatedCourse)
                }
                onAddEvent={handleAddCourseEvent}
              />
            )}

            {currentView === ViewMode.HANDOFF && activePatient && (
              <SummaryView
                data={activePatient.handoff}
                patientInfo={activePatient.patientInfo}
                onUpdate={handleUpdateHandoff}
                onRefresh={handleRefreshSummary}
                isRefreshing={isRefreshingSummary}
              />
            )}

            {currentView === ViewMode.ORDERS && activePatient && (
              <OrdersView
                patientId={activePatient.id}
                orders={activePatient.orders || []}
                medications={activePatient.medications || []}
                encounters={activePatient.encounters}
                onUpdateOrders={handleUpdateOrders}
                onUpdateMedications={handleUpdateMedications}
                patientInfo={activePatient.patientInfo}
              />
            )}

            {currentView === ViewMode.NOTES && activePatient && (
              <NotesView
                notes={activePatient.notes || []}
                onUpdateNotes={handleUpdateNotes}
                chartContext={activePatient}
              />
            )}

            {currentView === ViewMode.SETTINGS && (
              <SettingsView
                defaultSpecialization={defaultSpecialization}
                setDefaultSpecialization={setDefaultSpecialization}
                defaultModel={defaultModel}
                setDefaultModel={setDefaultModel}
              />
            )}
          </div>

          <footer className="py-6 border-t border-border-default mt-auto bg-surface/50 shrink-0">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-8 text-xs text-content-muted">
              <p>
                &copy; {new Date().getFullYear()} <BrandName />
              </p>
              <div className="flex space-x-6">
                <button
                  onClick={() => {
                    setHasPrivacyMounted(true);
                    setIsPrivacyOpen(true);
                  }}
                  className="hover:text-action transition-colors font-medium"
                >
                  Privacy
                </button>
                <button
                  onClick={() => {
                    setHasTermsMounted(true);
                    setIsTermsOpen(true);
                  }}
                  className="hover:text-action transition-colors font-medium"
                >
                  Terms
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {activePatient && (
        <button
          onClick={() => {
            setHasChatMounted(true);
            setIsChatOpen(true);
          }}
          className={`fixed right-6 h-14 w-14 bg-action text-white rounded-full shadow-xl hover:bg-action-hover focus:outline-none focus:ring-4 focus:ring-action-300 transition-all transform hover:scale-105 flex items-center justify-center z-40 ${isChatOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"} ${showMobileNav ? "bottom-24 md:bottom-6" : "bottom-6"}`}
          title="Open Clinical Assistant"
        >
          <Icons.Chat className="w-7 h-7" />
        </button>
      )}

      {hasChatMounted && (
        <ChatPanel
          key={chatSessionId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chartData={activePatient}
          onSaveAsNote={handleSaveChatAsNote}
          model={model}
          onModelChange={setModel}
        />
      )}

      {hasPrivacyMounted && (
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
      )}
      {hasTermsMounted && (
        <TermsOfServiceModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
