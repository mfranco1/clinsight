import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import ClinicalMarkdown from './ClinicalMarkdown';
import { GroundingSource } from '../../types';

interface EditableTextAreaProps {
  value: string;
  onSave?: (newValue: string) => void;
  onChange?: (newValue: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  groundingSources?: GroundingSource[];
  showReferences?: boolean;
  className?: string;
  showControls?: boolean;
  autoFocus?: boolean;
  hideEditButton?: boolean;
  minHeight?: string;
  searchQuery?: string;
  disabled?: boolean;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onSave,
  onChange,
  onCancel,
  placeholder = "Enter text...",
  isEditing: externalIsEditing,
  setIsEditing: externalSetIsEditing,
  groundingSources,
  showReferences = false,
  className = "",
  showControls = true,
  autoFocus = true,
  hideEditButton = false,
  minHeight = "min-h-[120px]",
  searchQuery,
  disabled = false
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = externalSetIsEditing !== undefined ? externalSetIsEditing : setInternalIsEditing;

  const [editValue, setEditValue] = useState(() => value ? value.replace(/\\n/g, '\n') : '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isManualResized, setIsManualResized] = useState(false);

  useEffect(() => {
    setEditValue(value ? value.replace(/\\n/g, '\n') : '');
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current && autoFocus) {
      textareaRef.current.focus();
      if (!isManualResized) {
        adjustHeight();
      }
    }
  }, [isEditing, autoFocus]);

  const adjustHeight = () => {
    if (textareaRef.current && !isManualResized) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    const textToInsert = prefix + selectedText + suffix;

    // Try to use execCommand to preserve native undo stack
    textarea.focus();
    try {
      // This is deprecated but widely used for textarea formatting to preserve undo history
      const success = document.execCommand('insertText', false, textToInsert);

      if (!success) {
        throw new Error('execCommand failed');
      }

      // Sync React state with updated textarea value
      const newValue = textarea.value;
      setEditValue(newValue);
      if (onChange) onChange(newValue);

      // Restore selection around the original text
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    } catch (err) {
      // Fallback to manual state update if execCommand fails
      const newValue = 
        editValue.substring(0, start) + 
        textToInsert + 
        editValue.substring(end);
      
      setEditValue(newValue);
      if (onChange) onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          end + prefix.length
        );
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('**', '**');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('*', '*');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('<u>', '</u>');
          break;
        case 'k':
          e.preventDefault();
          applyFormatting('[', '](https://)');
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting('~~', '~~');
          }
          break;
        case 'enter':
          e.preventDefault();
          handleSave();
          break;
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    if (onSave) onSave(editValue);
    setIsEditing(false);
    setIsManualResized(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setIsManualResized(false);
    if (onCancel) onCancel();
  };

  const handleMouseDown = () => {
    // Detect manual resize start
    const handleMouseUp = () => {
      setIsManualResized(true);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              adjustHeight();
              if (onChange) onChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            placeholder={placeholder}
            className={`w-full text-[13px] text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 p-4 ${minHeight} transition-all resize-y`}
          />
        {showControls && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`group relative rounded-xl hover:bg-slate-50/50 transition-all p-1 -m-1 ${className}`}
    >
      {!hideEditButton && !disabled && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 bg-white rounded-xl border border-slate-200 shadow-sm z-10"
          title="Edit"
        >
          <Icons.Edit className="w-4 h-4" />
        </button>
      )}
      {value ? (
        <ClinicalMarkdown 
          content={value} 
          groundingSources={groundingSources}
          showReferences={showReferences}
          searchQuery={searchQuery}
        />
      ) : (
        <div 
          onClick={() => { if (!disabled) setIsEditing(true); }}
          className={`py-1 ${!disabled ? 'cursor-pointer hover:text-teal-600 transition-colors' : ''}`}
        >
          <span className="text-slate-400 italic text-[13px]">
            {disabled ? "No data recorded." : (placeholder || "No data recorded. Click to edit.")}
          </span>
        </div>
      )}
    </div>
  );
};

export default EditableTextArea;
