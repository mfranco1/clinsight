
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PatientHeader from './components/PatientHeader';
import InputSection from './components/InputSection';
import SoapView from './components/SoapView';
import CourseView from './components/CourseView';
import SummaryView from './components/SummaryView';
import NotesView from './components/NotesView';
import OrdersView from './components/OrdersView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import LoadingOverlay from './components/LoadingOverlay';
import ChatPanel from './components/ChatPanel';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import TermsOfServiceModal from './components/TermsOfServiceModal';
import Toast from './components/Toast';
import { Icons } from './components/ui/Icons';
import DashboardView from './components/DashboardView';
import { MedicalChartResponse, ViewMode, FileUpload, SoapNote, GeneralData, ChartEntry, HandoffSummary, PatientNote, PatientOrder, OrderStatus, MedicationOrder, PatientStatus, EncounterType, DeceasedInfo, CauseOfDeath } from './types';
import { useFileUpload } from './hooks/useFileUpload';
import { generateMedicalChart, reassessSoapNote, generateProgressNote, refreshPatientSummary } from './services/geminiService';
import { requestNotificationPermission, sendNotification } from './services/notificationService';
import { DEFAULT_MODEL } from './config/appConfig';
import { getLocalDateString, getTodayLocalDateString, createId, getTodayDate, getCurrentTime24, getLocalDateTimeParts, normalizeDateInput, safeStorage, normalizePatientAgeSex } from './utils';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const { 
    files: inputFiles, 
    setFiles: setInputFiles, 
    addFiles: addInputFiles, 
    removeFile: removeInputFile, 
    clear: clearInputFiles 
  } = useFileUpload();
  const [inputText, setInputText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReassessing, setIsReassessing] = useState<boolean>(false);
  
  // Multi-patient state
  const [patients, setPatients] = useState<MedicalChartResponse[]>(() => {
    const saved = safeStorage.getItem('clinsight_patients');
    if (saved) {
      try {
        const parsed: MedicalChartResponse[] = JSON.parse(saved);
        // Migration: add encounters if missing
        return parsed.map(p => {
          let updatedP = { ...p };
          updatedP.patientInfo = normalizePatientAgeSex(updatedP.patientInfo);
          let firstEncounterId: string;
          
          if (!updatedP.encounters || updatedP.encounters.length === 0) {
            firstEncounterId = createId();
            const type = updatedP.patientInfo.status === PatientStatus.OUTPATIENT ? EncounterType.CONSULT : EncounterType.ADMISSION;
            const status = updatedP.patientInfo.status === PatientStatus.DISCHARGED ? 'COMPLETED' : 'ACTIVE';
            const startDate = updatedP.patientInfo.admissionDate || p.entries[p.entries.length - 1]?.date || new Date().toISOString();
            updatedP.encounters = [{ id: firstEncounterId, type, status, startDate }];
          } else {
            firstEncounterId = updatedP.encounters[0].id;
          }

          // Ensure all entries have an encounterId
          updatedP.entries = updatedP.entries.map(e => e.encounterId ? e : { ...e, encounterId: firstEncounterId });
          
          // Ensure all course events have an encounterId
          updatedP.course = (updatedP.course || []).map(ev => ev.encounterId ? ev : { ...ev, encounterId: firstEncounterId });
          
          // Ensure all orders have an encounterId
          if (updatedP.orders) {
            updatedP.orders = updatedP.orders.map(o => o.encounterId ? o : { ...o, encounterId: firstEncounterId });
          }

          return updatedP;
        });
      } catch (e) {
        console.error("Failed to load patients from storage", e);
        return [];
      }
    }
    return [];
  });
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [defaultModel, setDefaultModel] = useState<string>(() => safeStorage.getItem('clinsight_default_model') || DEFAULT_MODEL);
  const [defaultSpecialization, setDefaultSpecialization] = useState<string>(() => safeStorage.getItem('clinsight_default_specialization') || 'General Practice');
  const [model, setModel] = useState<string>(defaultModel);
  const [specialization, setSpecialization] = useState<string>(defaultSpecialization);
  
  // Derived active patient
  const activePatient = patients.find(p => p.id === activePatientId) || null;

  // Persistence: Save to localStorage whenever patients change
  useEffect(() => {
    safeStorage.setItem('clinsight_patients', JSON.stringify(patients));
  }, [patients]);

  // Carry over undone orders for all patients
  useEffect(() => {
    const today = getTodayLocalDateString();
    const undoneStatuses = [OrderStatus.PENDING, OrderStatus.ONGOING, OrderStatus.WAITING, OrderStatus.PAUSED];
    
    let hasChanges = false;
    const updatedPatients = patients.map(patient => {
      if (!patient.orders) return patient;
      
      let patientHasChanges = false;
      const updatedOrders = patient.orders.map(order => {
        const orderDate = getLocalDateString(order.targetDate);
        if (undoneStatuses.includes(order.status) && orderDate < today) {
          hasChanges = true;
          patientHasChanges = true;
          const oldDate = new Date(order.targetDate);
          const newDate = new Date();
          if (!isNaN(oldDate.getTime())) {
            newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds(), oldDate.getMilliseconds());
          }
          return { ...order, targetDate: newDate.toISOString() };
        }
        return order;
      });
      
      if (patientHasChanges) {
        return { ...patient, orders: updatedOrders };
      }
      return patient;
    });

    if (hasChanges) {
      setPatients(updatedPatients);
    }
  }, [patients]);

  useEffect(() => {
    safeStorage.setItem('clinsight_default_model', defaultModel);
    setModel(defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    safeStorage.setItem('clinsight_default_specialization', defaultSpecialization);
    setSpecialization(defaultSpecialization);
  }, [defaultSpecialization]);
  
  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<number>(0);

  // Legal Modals State
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Summary Refresh State
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);

  // Close chat and reset session when active patient changes or is cleared
  useEffect(() => {
    setIsChatOpen(false);
    setChatSessionId(prev => prev + 1);
  }, [activePatientId]);

  // Ref to track the current generation request ID to handle cancellations
  const generationRequestId = useRef<number>(0);
  
  // Ref for the main scrollable container
  const mainContentRef = useRef<HTMLElement>(null);

  const [showMobileNav, setShowMobileNav] = useState(true);
  const lastScrollY = useRef(0);
  
  // Handle mobile nav visibility on scroll
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || target.scrollTop === undefined) return;
      
      // Check if the target is the main container or an internal main scroll container
      const isMainContent = target === mainContentRef.current;
      const isInternalScroll = target.classList.contains('main-scroll-container');
      
      if (!isMainContent && !isInternalScroll) return;

      const currentScrollY = target.scrollTop;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowMobileNav(false);
      } else {
        setShowMobileNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    // Use capture to catch scroll events from children (since scroll doesn't bubble)
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [currentView]);

  // Scroll to top whenever view changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    lastScrollY.current = 0;
    setShowMobileNav(true);
  }, [currentView, activeEntryId]);

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
      ViewMode.APPEND_ENTRY
    ];

    if (!patientSpecificViews.includes(currentView)) {
      setActivePatientId(null);
      setActiveEntryId(null);
    }
  }, [currentView]);

  const handleNavigate = (view: ViewMode) => {
    const patientSpecificViews = [
      ViewMode.PROFILE,
      ViewMode.CHART,
      ViewMode.COURSE,
      ViewMode.HANDOFF,
      ViewMode.ORDERS,
      ViewMode.NOTES,
      ViewMode.APPEND_ENTRY
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
      const filesToUpload = inputFiles.map(f => f.file);
      
      if (activePatient) {
        // Progress Note flow
        const result = await generateProgressNote(
          inputText,
          filesToUpload,
          model,
          specialization,
          true,
          activePatient.entries
        );

        if (generationRequestId.current === requestId) {
          const newEntryId = createId('entry');
          const { date: currentSystemDate, time: currentSystemTime } = getLocalDateTimeParts();
          
          const finalDate = result.inferredDate ? (normalizeDateInput(result.inferredDate) || currentSystemDate) : currentSystemDate;
          const finalTime = result.inferredTime ? result.inferredTime : currentSystemTime;
          const effectiveDate = `${finalDate} ${finalTime}`;
          
          const activeEncounter = activePatient.encounters?.find(e => e.status === 'ACTIVE');
          const isConsult = activeEncounter?.type === EncounterType.CONSULT;
          const isFirstEntryInEncounter = !activePatient.entries?.some(e => e.encounterId === activeEncounter?.id);
          const finalTitle = isConsult ? "Consult Note" : (isFirstEntryInEncounter ? "Admission Note" : "Progress Note");

          const newEntry: ChartEntry = {
            id: newEntryId,
            encounterId: activeEncounter?.id,
            date: effectiveDate,
            title: finalTitle,
            type: "SOAP",
            entryType: 'structured',
            soap: result.soap,
            originalNote: inputText,
            specialization: specialization,
            attachments: [...inputFiles],
            references: result.references,
            groundingSources: result.groundingSources
          };

          const newCourseEvent = {
            encounterId: activeEncounter?.id,
            date: finalDate,
            time: finalTime,
            event: isFirstEntryInEncounter ? finalTitle : result.courseEvent.event,
            details: result.courseEvent.details
          };

          setPatients(prev => prev.map(p => p.id === activePatient.id ? {
            ...p,
            entries: [newEntry, ...p.entries],
            course: [...(p.course || []), newCourseEvent].sort((a, b) => new Date(`${b.date} ${b.time || '00:00'}`).getTime() - new Date(`${a.date} ${a.time || '00:00'}`).getTime()),
          } : p));

          setActiveEntryId(newEntryId);
          handleNavigate(ViewMode.CHART);
          setChatSessionId(prev => prev + 1);
          
          sendNotification(isFirstEntryInEncounter ? (isConsult ? "Consult Note Generated" : "Admission Note Generated") : "Progress Note Generated", {
            body: `A new ${isFirstEntryInEncounter ? (isConsult ? "consult" : "admission") : "progress"} note has been added for ${activePatient.patientInfo.patientName}.`,
            tag: "chart-generation"
          });

          setInputText("");
          clearInputFiles();
        }
      } else {
        // Admission Note flow
        const data = await generateMedicalChart(
          inputText, 
          filesToUpload, 
          model, 
          specialization, 
          true, 
          [],
          null
        );
        
        if (generationRequestId.current === requestId) {
          const newEntryId = createId('entry');
          
          // Helper to ensure yyyy-mm-dd format
          const toYYYYMMDD = (dateStr: string | undefined | null): string => {
            if (!dateStr || dateStr.toLowerCase() === 'not recorded') return 'Not Recorded';
            return normalizeDateInput(dateStr) || dateStr;
          };

          const getTodayISO = () => getTodayDate();
          const getNowTime24 = () => getCurrentTime24();
          
          const rawAdmissionDate = data.patientInfo.admissionDate;
          const isAdmissionMissing = !rawAdmissionDate || rawAdmissionDate.toLowerCase() === 'not recorded';
          
          // Ensure date defaults to today if "Not Recorded" is returned from the analysis
          const effectiveDate = isAdmissionMissing ? `${getTodayISO()} ${getNowTime24()}` : `${toYYYYMMDD(rawAdmissionDate)} ${getNowTime24()}`;

          // Normalize Patient Info dates for the Face Sheet
          data.patientInfo.dob = toYYYYMMDD(data.patientInfo.dob);
          
          // Normalize course event dates
          if (data.course) {
            data.course = data.course.map(ev => ({
              ...ev,
              encounterId: newEntryId,
              date: toYYYYMMDD(ev.date) === 'Not Recorded' ? getTodayISO() : toYYYYMMDD(ev.date),
              time: ev.time || getNowTime24()
            }));
          }

          if (data.orders) {
            data.orders = data.orders.map(o => ({
              ...o,
              encounterId: newEntryId
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
              entryType: 'structured',
              soap: data.soap,
              originalNote: inputText,
              specialization: specialization,
              attachments: [...inputFiles],
              references: data.references,
              groundingSources: data.groundingSources
          };

          const newCourseEvent = {
            encounterId: newEntryId,
            date: getTodayISO(),
            time: getNowTime24(),
            event: isConsult ? 'Start Consult' : 'Admission',
            details: `Patient registered under ${specialization}`
          };

          const newPatient = {
              ...data,
              patientInfo: normalizePatientAgeSex({
                ...data.patientInfo,
                status: isConsult ? PatientStatus.OUTPATIENT : PatientStatus.ADMITTED
              }),
              encounters: [{
                id: newEntryId,
                type: isConsult ? EncounterType.CONSULT : EncounterType.ADMISSION,
                startDate: effectiveDate,
                status: 'ACTIVE' as const
              }],
              entries: [newEntry],
              course: data.course && data.course.length > 0 ? data.course : [newCourseEvent]
          };
          setPatients(prev => [newPatient, ...prev]);
          setActivePatientId(newPatient.id);
          
          setActiveEntryId(newEntryId);
          handleNavigate(ViewMode.CHART);
          setChatSessionId(prev => prev + 1);
          
          sendNotification("Chart Generated", {
            body: `The ${isConsult ? 'Consult' : 'Admission'} Note for ${newPatient.patientInfo.patientName} is ready.`,
            tag: "chart-generation"
          });

          setInputText("");
          clearInputFiles();
        }
      }
    } catch (err: any) {
      if (generationRequestId.current === requestId) {
        console.error(err);
        setError(err.message || "An unexpected error occurred while generating the chart. Please try again.");
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
    const today = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    const isFirstEntry = !activePatient;
    const activeEnc = activePatient?.encounters?.find(e => e.status === 'ACTIVE');
    const isConsult = isFirstEntry ? isConsultBase : activeEnc?.type === EncounterType.CONSULT;
    const isFirstEntryInEncounter = activePatient ? !activePatient.entries?.some(e => e.encounterId === activeEnc?.id) : true;
    const finalTitle = isConsult ? "Consult Note" : ((isFirstEntry || isFirstEntryInEncounter) ? "Admission Note" : "Progress Note");
    const finalType = isConsult ? "Consult" : ((isFirstEntry || isFirstEntryInEncounter) ? "Admission" : "Progress");

    const newEntry: ChartEntry = {
      id: newEntryId,
      encounterId: activeEnc?.id,
      date: `${today} ${time}`,
      title: finalTitle,
      type: finalType,
      entryType: 'raw',
      rawText: inputText,
      originalNote: inputText,
      specialization: specialization,
      attachments: [...inputFiles]
    };

    const newEvent = {
      date: today,
      time: time,
      event: finalTitle,
      details: inputText.substring(0, 200) + (inputText.length > 200 ? "..." : "")
    };

    if (isFirstEntry) {
      // Initialize new chart with placeholder patient info
      const newPatientId = createId();
      const encounterId = createId();
      const now = new Date().toISOString();

      const newEventWithEncounter = {
        ...newEvent,
        encounterId
      };

      const newPatient: MedicalChartResponse = {
        id: newPatientId,
        patientInfo: normalizePatientAgeSex({
          patientName: "Not Recorded",
          ageSex: "Not Recorded",
          mrn: "Not Recorded",
          dob: "Not Recorded",
          admissionDate: today,
          status: isConsult ? PatientStatus.OUTPATIENT : PatientStatus.ADMITTED,
          address: "Not Recorded",
          religion: "Not Recorded",
          handedness: "Not Recorded",
          location: "Not Recorded",
          contactNumber: "Not Recorded",
          email: "Not Recorded"
        }),
        encounters: [{
          id: encounterId,
          type: isConsult ? EncounterType.CONSULT : EncounterType.ADMISSION,
          startDate: now,
          status: 'ACTIVE'
        }],
        entries: [{ ...newEntry, encounterId }],
        course: [newEventWithEncounter],
        handoff: {
          patientId: "Not Recorded",
          oneLiner: "Manual admission recorded.",
          activeIssues: ["Manual admission"],
          toDoList: ["Review patient history"]
        }
      };
      setPatients(prev => [newPatient, ...prev]);
      setActivePatientId(newPatientId);
    } else {
      const activeEnc = activePatient?.encounters?.find(e => e.status === 'ACTIVE');
      const newEventWithEncounter = {
        ...newEvent,
        encounterId: activeEnc?.id
      };
      
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        entries: [newEntry, ...p.entries],
        course: [...p.course, newEventWithEncounter]
      } : p));
    }

    setActiveEntryId(newEntryId);
    handleNavigate(ViewMode.CHART);
    setInputText("");
    clearInputFiles();
    
    sendNotification("Manual Note Saved", {
      body: `A manual ${isFirstEntry || isFirstEntryInEncounter ? (isConsult ? "consult" : "admission") : "progress"} note has been saved.`,
      tag: "manual-note"
    });
  };

  const handleReassess = async () => {
    if (!activePatient || !activeEntryId || isReassessing) return;

    const activeEntry = activePatient.entries.find(e => e.id === activeEntryId);
    if (!activeEntry || !activeEntry.soap) return;

    setIsReassessing(true);
    setError(null);

    try {
      // Get the most recent 2 historical entries
      const recentHistory = activePatient.entries
        .filter(e => e.id !== activeEntryId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

      // Always use search grounding
      const result = await reassessSoapNote(activeEntry.soap, recentHistory, model, specialization, true);
      
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        entries: p.entries.map(e => e.id === activeEntryId ? {
           ...e,
           soap: {
               ...e.soap,
               assessment: result.assessment,
               plan: result.plan
           },
           references: result.references || e.references,
           groundingSources: result.groundingSources || e.groundingSources
        } : e),
      } : p));

      // Send notification
      sendNotification("Reassessment Complete", {
        body: `The SOAP note reassessment for ${activePatient?.patientInfo.patientName || "the patient"} is finished.`,
        tag: "reassessment"
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reassess the patient based on current data.");
    } finally {
      setIsReassessing(false);
    }
  };

  const handleAssess = async () => {
    if (!activePatient || !activeEntryId || isReassessing) return;

    const activeEntry = activePatient.entries.find(e => e.id === activeEntryId);
    if (!activeEntry || activeEntry.entryType !== 'raw') return;

    setIsReassessing(true);
    setError(null);

    try {
      const rawText = activeEntry.rawText || activeEntry.originalNote || "";
      
      // Get history up to this entry
      const entryIndex = activePatient.entries.findIndex(e => e.id === activeEntryId);
      const history = activePatient.entries.slice(entryIndex + 1); // Older entries are after this one in the array (newest first)

      const result = await generateProgressNote(
        rawText, 
        activeEntry.attachments?.map(a => a.file) || [], 
        model, 
        specialization, 
        true, 
        history
      );
      
      const getTodayISO = () => getTodayDate();
      const getNowTime24 = () => getCurrentTime24();

      setPatients(prev => prev.map(p => {
        if (p.id !== activePatientId) return p;

        const newCourseEvent = {
          date: activeEntry.date.split(' ')[0] || getTodayISO(),
          time: activeEntry.date.split(' ')[1] || getNowTime24(),
          event: result.courseEvent.event,
          details: result.courseEvent.details,
          encounterId: activeEntry.encounterId
        };

        return {
          ...p,
          entries: p.entries.map(e => e.id === activeEntryId ? {
             ...e,
             entryType: 'structured',
             soap: result.soap,
             references: result.references,
             groundingSources: result.groundingSources
          } : e),
          course: [...(p.course || []), newCourseEvent].sort((a, b) => new Date(`${b.date} ${b.time || '00:00'}`).getTime() - new Date(`${a.date} ${a.time || '00:00'}`).getTime()),
        };
      }));

      sendNotification("Assessment Complete", {
        body: `The clinical assessment for ${activePatient?.patientInfo.patientName || "the patient"} is finished.`,
        tag: "assessment"
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate assessment based on the clinical note.");
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
    setActivePatientId(null);
    setIsGenerating(false);
    setIsReassessing(false);
    generationRequestId.current = 0;
    handleNavigate(ViewMode.DASHBOARD);
    setIsChatOpen(false);
    setChatSessionId(prev => prev + 1);
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
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      entries: p.entries.map(e => e.id === entryId ? { ...e, soap: updatedSoap } : e)
    } : p));
  };

  const handleUpdateEntry = (entryId: string, updatedEntry: ChartEntry) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      entries: p.entries.map(e => e.id === entryId ? updatedEntry : e)
    } : p));
  };

  const handleUpdatePatientInfo = (updatedInfo: GeneralData) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      patientInfo: normalizePatientAgeSex(updatedInfo)
    } : p));
  };
  
  const handleUpdateCourse = (updatedCourse: any[]) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      course: updatedCourse
    } : p));
  };

  const handleUpdateHandoff = (updatedHandoff: HandoffSummary) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      handoff: updatedHandoff
    } : p));
  };

  const handleUpdateOrders = (updatedOrders: PatientOrder[]) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      orders: updatedOrders
    } : p));
  };

  const handleUpdateMedications = (updatedMeds: MedicationOrder[]) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      medications: updatedMeds
    } : p));
  };

  const handleRefreshSummary = async () => {
    if (!activePatient || isRefreshingSummary) return;
    setIsRefreshingSummary(true);
    try {
      const recentEntries = activePatient.entries.slice(0, 3);
      const recentCourse = (activePatient.course || []).slice(0, 5);
      
      const updatedSummary = await refreshPatientSummary(
        activePatient.handoff,
        activePatient.patientInfo,
        recentEntries,
        recentCourse,
        model,
        specialization
      );
      
      handleUpdateHandoff(updatedSummary);
      sendNotification("Summary Updated", {
        body: `The patient summary has been refreshed with the latest clinical data.`,
        tag: "summary-refresh"
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to refresh patient summary.");
    } finally {
      setIsRefreshingSummary(false);
    }
  };

  const handleUpdateNotes = (updatedNotes: PatientNote[]) => {
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      notes: updatedNotes
    } : p));
  };

  const handleUpdateGlobalOrder = (patientId: string, updatedOrder: PatientOrder) => {
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      orders: (p.orders || []).map(o => o.id === updatedOrder.id ? updatedOrder : o)
    } : p));
  };

  const handleSaveChatAsNote = (content: string, groundingSources?: any[], title?: string) => {
    if (!activePatientId) return;
    
    const newNote: PatientNote = {
      id: Date.now().toString(),
      title: title || "Assistant Response",
      content: content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isAssistant: true,
      groundingSources: groundingSources
    };
    
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      notes: [newNote, ...(p.notes || [])]
    } : p));
    
    sendNotification("Note Saved", {
      body: "The assistant response has been saved to patient notes.",
      tag: "chat-to-note"
    });
  };

  const handleAddCourseEvent = () => {
    if (!activePatientId || !activePatient) return;
    const today = getTodayDate();
    const now = getCurrentTime24();
    
    // Find active encounter
    const activeEncounter = activePatient.encounters?.find(e => e.status === 'ACTIVE');

    const newEvent = {
      id: createId(),
      encounterId: activeEncounter?.id,
      date: today,
      time: now,
      event: "New Clinical Event",
      details: "Enter clinical details here..."
    };
    
    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      course: [...(p.course || []), newEvent]
    } : p));
  };

  const handleSelectPatient = (id: string, initialView: ViewMode = ViewMode.CHART) => {
    setActivePatientId(id);
    const patient = patients.find(p => p.id === id);
    if (patient && patient.entries.length > 0) {
      setActiveEntryId(patient.entries[0].id);
    }
    handleNavigate(initialView);
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    if (activePatientId === id) {
      handleNavigate(ViewMode.DASHBOARD);
    }
  };

  const handleUpdatePatientStatus = (id: string, status: PatientStatus, dischargeDateTime?: string, deceasedInfo?: DeceasedInfo) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== id) return p;

      const now = new Date().toISOString();
      const encounters = p.encounters || [];
      
      // Complete any active encounter
      const updatedEncounters = encounters.map(enc => 
        enc.status === 'ACTIVE' 
          ? { 
              ...enc, 
              status: 'COMPLETED' as const, 
              endDate: status === PatientStatus.DISCHARGED && dischargeDateTime 
                ? new Date(dischargeDateTime.replace(' ', 'T')).toISOString() 
                : status === PatientStatus.DECEASED && deceasedInfo 
                  ? new Date(`${deceasedInfo.date}T${deceasedInfo.time}`).toISOString()
                  : now 
            } 
          : enc
      );

      let updatedPatientInfo = normalizePatientAgeSex({ ...p.patientInfo, status });

      // Create new encounter for ADMITTED or OUTPATIENT
      if (status === PatientStatus.ADMITTED || status === PatientStatus.OUTPATIENT) {
        const { date, time } = getLocalDateTimeParts();
        const effectiveDate = `${date} ${time}`;
        
        updatedEncounters.push({
          id: createId(),
          type: status === PatientStatus.ADMITTED ? EncounterType.ADMISSION : EncounterType.CONSULT,
          status: 'ACTIVE',
          startDate: now
        });

        // Update admission date for UI counter
        updatedPatientInfo.admissionDate = effectiveDate;
        // Clear discharge date and deceased info on readmission
        updatedPatientInfo.dischargeDate = undefined;
        updatedPatientInfo.deceasedInfo = undefined;
        updatedPatientInfo = normalizePatientAgeSex(updatedPatientInfo);
      } else if (status === PatientStatus.DISCHARGED) {
        // Set discharge date
        updatedPatientInfo.dischargeDate = dischargeDateTime || `${getTodayDate()} ${getCurrentTime24()}`;
        updatedPatientInfo = normalizePatientAgeSex(updatedPatientInfo);
      } else if (status === PatientStatus.DECEASED) {
        // Set deceased info
        updatedPatientInfo.deceasedInfo = deceasedInfo;
        updatedPatientInfo = normalizePatientAgeSex(updatedPatientInfo);
      }

      return {
        ...p,
        patientInfo: updatedPatientInfo,
        encounters: updatedEncounters
      };
    }));
  };

  const handleReactivateEncounter = (id: string, encounterId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== id) return p;

      const encounters = p.encounters || [];
      const targetEncounter = encounters.find(enc => enc.id === encounterId);
      if (!targetEncounter) return p;

      // 1. Mark the target encounter status as 'ACTIVE' and clear endDate
      const updatedEncounters = encounters.map(enc => 
        enc.id === encounterId 
          ? { ...enc, status: 'ACTIVE' as const, endDate: undefined } 
          : enc
      );

      // 2. Set the patient's status back to ADMITTED or OUTPATIENT based on encounter type
      const newStatus = targetEncounter.type === EncounterType.ADMISSION 
        ? PatientStatus.ADMITTED 
        : PatientStatus.OUTPATIENT;

      const updatedPatientInfo = normalizePatientAgeSex({
        ...p.patientInfo,
        status: newStatus
      });

      return {
        ...p,
        patientInfo: updatedPatientInfo,
        encounters: updatedEncounters
      };
    }));
  };

  const handleDeleteEntry = (id: string) => {
    if (!activePatient) return;
    
    const updatedEntries = activePatient.entries.filter(e => e.id !== id);
    
    if (updatedEntries.length === 0) {
      handleDeletePatient(activePatient.id);
      return;
    }

    setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      entries: updatedEntries
    } : p));

    if (activeEntryId === id) {
      setActiveEntryId(updatedEntries[0].id);
    }
  };

  const handleExportCase = (patient: MedicalChartResponse) => {
    const fileName = `Clinsight_Case_${patient.patientInfo.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    const jsonString = JSON.stringify(patient, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCase = (data: MedicalChartResponse | MedicalChartResponse[]) => {
    if (Array.isArray(data)) {
      if (data.length === 0) return;
      if (data.length === 1) {
        const singleCase = data[0];
        if (!singleCase.id) {
          singleCase.id = createId();
        }
        setPatients(prev => [singleCase, ...prev]);
        setActivePatientId(singleCase.id);
        if (singleCase.entries.length > 0) {
          setActiveEntryId(singleCase.entries[0].id);
        }
        handleNavigate(ViewMode.CHART);
        setChatSessionId(prev => prev + 1);
      } else {
        const processedCases = data.map(c => {
          if (!c.id) {
            c.id = createId();
          }
          return c;
        });
        setPatients(prev => [...processedCases, ...prev]);
        handleNavigate(ViewMode.DASHBOARD);
        setToast({
          message: `Successfully uploaded ${data.length} patient cases`,
          type: 'success'
        });
      }
    } else {
      if (!data.id) {
        data.id = createId();
      }
      setPatients(prev => [data, ...prev]);
      setActivePatientId(data.id);
      if (data.entries.length > 0) {
          setActiveEntryId(data.entries[0].id);
      }
      handleNavigate(ViewMode.CHART);
      setChatSessionId(prev => prev + 1);
    }
  };

  if (currentView === ViewMode.ABOUT) {
    return <LandingPage onLaunchApp={() => handleNavigate(ViewMode.LOGIN)} />;
  }

  if (currentView === ViewMode.LOGIN) {
    return <LoginPage onLogin={handleLoginSuccess} onGoToAbout={() => handleNavigate(ViewMode.ABOUT)} />;
  }

  const activeEntry = activePatient?.entries.find(e => e.id === activeEntryId);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans relative overflow-hidden">
      {isGenerating && <LoadingOverlay onCancel={handleCancelGeneration} />}
      
      {error && <Toast message={error} onClose={() => setError(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        showMobileNav={showMobileNav}
      />

      <div id="working-view" className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <div className={`md:h-auto md:max-h-none md:opacity-100 md:pointer-events-auto transition-all duration-300 ease-in-out overflow-hidden shrink-0 z-40 bg-white ${
          showMobileNav 
            ? 'max-h-[145px] opacity-100' 
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          {activePatient && (currentView === ViewMode.CHART || currentView === ViewMode.COURSE || currentView === ViewMode.HANDOFF || currentView === ViewMode.PROFILE || currentView === ViewMode.APPEND_ENTRY || currentView === ViewMode.NOTES || currentView === ViewMode.ORDERS) ? (
            <PatientHeader 
              patientInfo={activePatient.patientInfo}
              activeEncounter={activePatient.encounters?.find(e => e.status === 'ACTIVE')}
              currentView={currentView}
              onNavigate={handleNavigate}
              onExport={() => handleExportCase(activePatient)}
              onBack={() => {
                handleNavigate(ViewMode.DASHBOARD);
              }}
            />
          ) : (
            <Header 
              activePatient={activePatient ? {
                name: activePatient.patientInfo.patientName,
                mrn: activePatient.patientInfo.mrn,
                ageSex: activePatient.patientInfo.ageSex
              } : null}
              currentView={currentView}
            />
          )}
        </div>

        <main 
          ref={mainContentRef}
          className={`flex-1 bg-slate-50/50 flex flex-col min-h-0 relative ${currentView === ViewMode.CHART ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          <div className={`flex-1 ${currentView === ViewMode.CHART ? 'h-full' : ''}`}>
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

            {(currentView === ViewMode.INPUT || currentView === ViewMode.APPEND_ENTRY) && (
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
                isFirstEntryInEncounter={activePatient ? !activePatient.entries?.some(e => e.encounterId === activePatient.encounters?.find(enc => enc.status === 'ACTIVE')?.id) : true}
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
                onUpdatePatientStatus={(status) => handleUpdatePatientStatus(activePatient.id, status)}
                onReactivateEncounter={(encounterId) => handleReactivateEncounter(activePatient.id, encounterId)}
                selectedModel={model}
                groundingSources={activeEntry.groundingSources} 
                references={activeEntry.references} 
                onUpdate={(updatedSoap) => handleUpdateEntrySoap(activeEntryId!, updatedSoap)} 
                onUpdateEntry={(updatedEntry) => handleUpdateEntry(updatedEntry.id, updatedEntry)}
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
                  const activeEncounter = activePatient.encounters?.find(e => e.status === 'ACTIVE');
                  const orderWithEncounter = { ...newOrder, encounterId: activeEncounter?.id };
                  handleUpdateOrders([orderWithEncounter, ...currentOrders]);
                }}
                onUpdateMedications={handleUpdateMedications}
              />
            )}

            {currentView === ViewMode.COURSE && activePatient && (
              <CourseView 
                events={activePatient.course} 
                encounters={activePatient.encounters}
                onUpdateEvents={(updatedCourse) => handleUpdateCourse(updatedCourse)}
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
          
        <footer className="py-6 border-t border-slate-200 mt-auto bg-white/50 shrink-0">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-8 text-xs text-slate-400">
               <p>&copy; {new Date().getFullYear()} Clinsight</p>
               <div className="flex space-x-6">
                 <button onClick={() => handleNavigate(ViewMode.ABOUT)} className="hover:text-teal-600 transition-colors font-medium">About</button>
                 <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-teal-600 transition-colors font-medium">Privacy</button>
                 <button onClick={() => setIsTermsOpen(true)} className="hover:text-teal-600 transition-colors font-medium">Terms</button>
               </div>
            </div>
          </footer>
        </main>
      </div>

      {activePatient && (
        <button
          onClick={() => setIsChatOpen(true)}
          className={`fixed right-6 h-14 w-14 bg-teal-600 text-white rounded-full shadow-xl hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all transform hover:scale-105 flex items-center justify-center z-40 ${isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'} ${showMobileNav ? 'bottom-24 md:bottom-6' : 'bottom-6'}`}
          title="Open Clinical Assistant"
        >
          <Icons.Chat className="w-7 h-7" />
        </button>
      )}

      <ChatPanel 
        key={chatSessionId}
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        chartData={activePatient} 
        onSaveAsNote={handleSaveChatAsNote}
        model={model}
        onModelChange={setModel}
      />

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsOfServiceModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}

export default App;
