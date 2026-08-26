
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, MedicalChartResponse, FileUpload, PatientNote } from '../types';
import { sendChatMessage, transcribeAudio } from '../services/geminiService';
import { formatLinks } from './soap/utils';
import { sendNotification } from '../services/notificationService';
import { Icons } from './ui/Icons';
import { MODELS, DEFAULT_MODEL } from '../constants';
import CameraCaptureModal from './CameraCaptureModal';
import ClinicalMarkdown from './ui/ClinicalMarkdown';
import { createFileUpload, openAttachment, revokeUrl } from '../services/fileService';
import { FileDropZone } from './ui/FileUpload/FileDropZone';
import { FilePreviewBadge } from './ui/FileUpload/FilePreviewBadge';
import { ClinicalChatInput } from './ui/ClinicalChatInput';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: MedicalChartResponse | null;
  onSaveAsNote?: (content: string, groundingSources?: any[], title?: string) => void;
  model: string;
  onModelChange: (model: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, chartData, onSaveAsNote, model, onModelChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<number>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatRequestId = useRef<number>(0);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default to desktop for initial render, adjusted by effect

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check screen size to toggle responsive behavior
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkScreen();
    
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      // Calculate new width: Window Width - Mouse X Position
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      
      // Constraints: Min 300px, Max 800px (or 80% of screen)
      if (newWidth > 300 && newWidth < Math.min(800, window.innerWidth * 0.8)) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      // Prevent text selection while dragging
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    const requestId = Date.now();
    chatRequestId.current = requestId;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: inputValue, 
      attachments: selectedFiles.length > 0 ? [...selectedFiles] : undefined 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    const currentFiles = [...selectedFiles];
    setSelectedFiles([]);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Always use search grounding
      const { text, title, groundingSources } = await sendChatMessage(
        model, 
        messages, 
        userMsg.text, 
        chartData, 
        true, 
        abortController.signal,
        currentFiles
      );
      
      if (chatRequestId.current === requestId) {
        const aiMsg: ChatMessage = { role: 'model', text: text, groundingSources, title: title || "Clinical Conversation" };
        setMessages(prev => [...prev, aiMsg]);

        // Send notification if panel is closed or tab is hidden
        if (!isOpen || document.visibilityState === 'hidden') {
          sendNotification("New Message from Clinical Assistant", {
            body: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
            tag: "chat-response"
          });
        }
      }
    } catch (error: any) {
      if (chatRequestId.current === requestId) {
        if (error.name === 'AbortError') {
          // Message was cancelled, don't add error message
        } else {
          const errorMsg: ChatMessage = { role: 'model', text: "Sorry, I encountered an error processing your request.", isError: true };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    } finally {
      if (chatRequestId.current === requestId) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelChat = () => {
    chatRequestId.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const transcription = await transcribeAudio(audioBlob);
          if (transcription) {
            setInputValue(prev => prev ? `${prev} ${transcription}` : transcription);
          }
        } catch (error) {
          console.error("Transcription failed:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addFiles = async (newFiles: File[]) => {
    const processedFiles = await Promise.all(
      newFiles.map(file => createFileUpload(file))
    );
    setSelectedFiles(prev => [...prev, ...processedFiles]);
  };

  const handleSaveAsNote = (msg: ChatMessage, idx: number) => {
    if (onSaveAsNote) {
      onSaveAsNote(msg.text, msg.groundingSources, msg.title);
      setSavedMessageIds(prev => new Set(prev).add(idx));
    }
  };

  const handleRetryMessage = async (errorMsgIdx: number) => {
    if (isLoading) return;

    // Find the preceding user message
    let userMsgIdx = -1;
    for (let i = errorMsgIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsgIdx = i;
        break;
      }
    }

    if (userMsgIdx === -1) return;

    const userMsg = messages[userMsgIdx];
    const history = messages.slice(0, userMsgIdx);

    const requestId = Date.now();
    chatRequestId.current = requestId;
    setIsLoading(true);

    // Remove the error message from the list
    setMessages(prev => prev.filter((_, i) => i !== errorMsgIdx));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const { text, title, groundingSources } = await sendChatMessage(
        model,
        history,
        userMsg.text,
        chartData,
        true,
        abortController.signal,
        userMsg.attachments
      );

      if (chatRequestId.current === requestId) {
        const aiMsg: ChatMessage = { role: 'model', text: text, groundingSources, title: title || "Clinical Conversation" };
        setMessages(prev => [...prev, aiMsg]);

        if (!isOpen || document.visibilityState === 'hidden') {
          sendNotification("New Message from Clinical Assistant", {
            body: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
            tag: "chat-response"
          });
        }
      }
    } catch (error: any) {
      if (chatRequestId.current === requestId) {
        if (error.name !== 'AbortError') {
          const errorMsg: ChatMessage = { role: 'model', text: "Sorry, I encountered an error processing your request.", isError: true };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    } finally {
      if (chatRequestId.current === requestId) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const renderMessageContent = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === 'user';
    
    if (!isUser) {
      return (
        <div className="relative group/msg">
          <ClinicalMarkdown 
            content={msg.text} 
            groundingSources={msg.groundingSources}
            className="prose-slate" 
            showReferences={true}
          />
          
          {onSaveAsNote && !msg.isError && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleSaveAsNote(msg, idx)}
                disabled={savedMessageIds.has(idx)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  savedMessageIds.has(idx)
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {savedMessageIds.has(idx) ? (
                  <>
                    <Icons.Check className="w-3 h-3" />
                    Saved to Notes
                  </>
                ) : (
                  <>
                    <Icons.Plus className="w-3 h-3" />
                    Save to Notes
                  </>
                )}
              </button>
            </div>
          )}

          {msg.isError && (
            <div className="mt-3 pt-3 border-t border-red-100 flex justify-end">
              <button
                onClick={() => handleRetryMessage(idx)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
              >
                <Icons.Refresh className="w-3 h-3 text-red-500" />
                Retry
              </button>
            </div>
          )}
        </div>
      );
    }

    const lines = msg.text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let currentList: React.ReactNode[] = [];
    let currentTableLines: string[] = [];
    
    // Dynamic color classes based on role
    const primaryTextColor = isUser ? 'text-white' : 'text-slate-700';
    const headingColor = isUser ? 'text-white' : 'text-slate-900';
    const subHeadingColor = isUser ? 'text-teal-50' : 'text-slate-800';
    const borderColor = isUser ? 'border-teal-400/40' : 'border-slate-100';

    // Helper to render lists
    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className={`list-disc pl-5 mb-3 space-y-1 ${primaryTextColor} leading-relaxed text-sm`}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    // Helper to render tables
    const flushTable = () => {
       if (currentTableLines.length > 0) {
           elements.push(renderTable(currentTableLines, elements.length));
           currentTableLines = [];
       }
    };

    const renderTable = (rows: string[], keyPrefix: number) => {
      // Clean rows
      const cleanRows = rows.map(r => {
        const cells = r.split('|');
        if (cells[0].trim() === '') cells.shift();
        if (cells[cells.length - 1].trim() === '') cells.pop();
        return cells.map(c => c.trim());
      });

      if (cleanRows.length === 0) return null;

      // Header row is always first
      const header = cleanRows[0];
      
      // Check if second row is a separator (e.g. |---|)
      let bodyStart = 1;
      if (cleanRows.length > 1 && cleanRows[1].some(c => c.match(/^-+$/))) {
        bodyStart = 2;
      }

      const body = cleanRows.slice(bodyStart);

      return (
        <div key={`table-${keyPrefix}`} className={`overflow-x-auto my-3 border ${isUser ? 'border-teal-400/50' : 'border-slate-200'} rounded-lg shadow-sm`}>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className={isUser ? 'bg-teal-700/50' : 'bg-slate-50'}>
              <tr>
                {header.map((h, idx) => (
                  <th key={idx} className={`px-3 py-2 text-left font-bold ${isUser ? 'text-teal-50' : 'text-slate-700'} uppercase tracking-wider text-xs border-r last:border-r-0 ${isUser ? 'border-teal-500/30' : 'border-slate-200'}`}>
                    {formatLinks(h, msg.groundingSources, isUser)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isUser ? 'bg-teal-600/50' : 'bg-white'}>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={isUser ? 'hover:bg-teal-500/30 transition-colors' : 'hover:bg-slate-50/50 transition-colors'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={`px-3 py-2 ${isUser ? 'text-white' : 'text-slate-600'} align-top leading-relaxed border-r last:border-r-0 ${isUser ? 'border-teal-500/20' : 'border-slate-100'}`}>
                      {formatLinks(cell, msg.groundingSources, isUser)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd(); 
      const trimmed = line.trim();
      
      // Table Block Detection (Line must start with pipe)
      if (trimmed.startsWith('|')) {
         flushList();
         currentTableLines.push(line);
         continue;
      } else {
         flushTable();
      }

      // List Block Detection
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[*\-•]\s+/, '');
        currentList.push(
          <li key={`li-${currentList.length}`}>
            {formatLinks(content, msg.groundingSources, isUser)}
          </li>
        );
        continue;
      } else {
        flushList();
      }

      // Empty Line
      if (!trimmed) {
        continue;
      }

      // Header 3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className={`text-sm font-bold ${headingColor} mt-4 mb-2 block`}>
            {formatLinks(trimmed.replace(/^###\s+/, ''), msg.groundingSources, isUser)}
          </h3>
        );
        continue;
      }

      // Header 2 or 1
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={`h2-${i}`} className={`text-base font-bold ${headingColor} mt-5 mb-3 border-b ${borderColor} pb-1 block`}>
            {formatLinks(trimmed.replace(/^#+\s+/, ''), msg.groundingSources, isUser)}
          </h2>
        );
        continue;
      }
      
      // Bold Header Line (e.g. "**Header:**")
      if (trimmed.match(/^\*\*.*?\*\*:/) || (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes('.'))) {
         elements.push(
             <div key={`boldhead-${i}`} className={`mt-3 mb-1 font-bold ${subHeadingColor} text-sm`}>
                 {formatLinks(trimmed, msg.groundingSources, isUser)}
             </div>
         );
         continue;
      }
      
      // References Header
      if (trimmed.toLowerCase() === 'sources:' || trimmed === '**Sources:**' || trimmed === 'Sources' || trimmed.toLowerCase() === 'references:' || trimmed === 'References') {
          elements.push(
              <h4 key={`src-header-${i}`} className={`text-xs font-bold ${isUser ? 'text-teal-200' : 'text-slate-500'} uppercase tracking-wider mt-6 mb-2 pt-4 border-t ${borderColor}`}>
                  References
              </h4>
          );
          continue;
      }

      // Default Paragraph
      elements.push(
        <div key={`p-${i}`} className={`mb-2 last:mb-0 leading-relaxed ${primaryTextColor} text-sm min-h-[1em]`}>
          {formatLinks(trimmed, msg.groundingSources, isUser)}
        </div>
      );
    }

    flushList();
    flushTable();
    
    return <div>{elements}</div>;
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Side Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full md:w-auto`}
        style={{ width: isDesktop ? sidebarWidth : '100%' }}
      >
        {/* Resize Handle (Desktop Only) */}
        <div 
            className="hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-teal-500/50 hover:w-1.5 transition-all z-50 group"
            onMouseDown={startResizing}
        >
            <div className="absolute inset-y-0 left-0 w-[1px] bg-slate-200 group-hover:bg-teal-400 transition-colors"></div>
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 relative select-none">
          <div className="flex items-center">
            <div className="bg-teal-100 p-1.5 rounded-lg mr-3">
                <Icons.Subjective className="w-5 h-5 text-teal-600" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-slate-800">Clinical Assistant</h2>
                <p className="text-xs text-slate-500">Ask questions about the case</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white space-y-2">
            {/* Model Selector */}
            <div className="flex bg-white p-1 rounded-lg">
                {MODELS.map(m => (
                  <button
                      key={m.id}
                      onClick={() => onModelChange(m.id)}
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${model === m.id ? 'bg-teal-100 text-teal-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      {m.label}
                  </button>
                ))}
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
            <FileDropZone 
              onFilesSelected={addFiles}
              onCameraClick={() => setIsCameraOpen(true)}
              className="absolute inset-0 z-10 opacity-0 hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
            />
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
                    <Icons.Info className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">
                        {chartData 
                            ? "Ask me anything about the patient's history, labs, or care plan." 
                            : "Please generate a patient chart first to ask specific questions."}
                    </p>
                </div>
            )}
            
            {messages.map((msg, idx) => (
                <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-teal-600 text-white rounded-br-none' 
                                : msg.isError
                                    ? 'bg-red-50/50 text-red-800 border border-red-200 rounded-bl-none'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                    >
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {msg.attachments.map((file, fIdx) => (
                              <FilePreviewBadge 
                                key={fIdx} 
                                file={file} 
                                onRemove={() => {}} // No removal for sent messages
                                onOpen={() => openAttachment(file)}
                              />
                            ))}
                          </div>
                        )}
                        {renderMessageContent(msg, idx)}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex flex-col items-start space-y-2">
                    <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <button 
                        onClick={handleCancelChat}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest pl-2 transition-colors flex items-center"
                    >
                        <Icons.Close className="w-3 h-3 mr-1" />
                        Cancel Request
                    </button>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <ClinicalChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                disabled={!chartData}
                placeholder={isTranscribing ? "Transcribing voice..." : chartData ? "Type your question..." : "Generate chart to start..."}
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                showVoiceOption={true}
                size="md"
            />
        </div>
      </div>

      <CameraCaptureModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(file) => addFiles([file])} 
      />
    </>
  );
};

export default ChatPanel;
