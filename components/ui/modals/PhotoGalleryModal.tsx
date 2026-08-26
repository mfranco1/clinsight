import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { FileUpload, PhotoCategory } from '../../../types';
import CameraCaptureModal from '../../CameraCaptureModal';
import { createFileUpload, openAttachment } from '../../../services/fileService';
import { FileDropZone } from '../FileUpload/FileDropZone';
import ModalShell from '../ModalShell';
import EmptyState from '../EmptyState';

const CATEGORIES: PhotoCategory[] = ['Physical Exam', 'Laboratory', 'Imaging'];

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: FileUpload[];
  onAddPhotos: (newPhotos: FileUpload[]) => void;
  onRemovePhoto: (index: number) => void;
  onAnalyzePhotos?: () => void;
  isAnalyzing?: boolean;
  onAnalyzeLabs?: () => void;
  isAnalyzingLabs?: boolean;
  onAnalyzeImaging?: () => void;
  isAnalyzingImaging?: boolean;
  initialTab?: PhotoCategory;
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ 
  isOpen, 
  onClose, 
  photos, 
  onAddPhotos, 
  onRemovePhoto,
  onAnalyzePhotos,
  isAnalyzing = false,
  onAnalyzeLabs,
  isAnalyzingLabs = false,
  onAnalyzeImaging,
  isAnalyzingImaging = false,
  initialTab = 'Physical Exam'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<PhotoCategory>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    const newFileUploads = await Promise.all(
      filesArray
        .filter(file => file.type.startsWith('image/'))
        .map(file => createFileUpload(file, activeTab))
    );

    if (newFileUploads.length > 0) {
      onAddPhotos(newFileUploads);
    }
    setShowUploadMenu(false);
  };

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Media Gallery"
        icon={Icons.Image}
        iconBgColor="bg-teal-100 text-teal-700"
        size="4xl"
        bodyClassName="flex flex-col overflow-hidden animate-fade-in"
        headerActions={
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-600/10 transition-all active:scale-95 flex items-center gap-2 mr-1 cursor-pointer"
            >
              UPLOAD
            </button>
            {showUploadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-1 animate-fade-in origin-top-right overflow-hidden">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) processFiles(files);
                    };
                    input.click();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  onClick={() => { setIsCameraOpen(true); setShowUploadMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Camera className="w-3.5 h-3.5" />
                  Camera
                </button>
              </div>
            )}
          </div>
        }
        footerActions={
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {photos.filter(p => p.category === activeTab || (!p.category && activeTab === 'Physical Exam')).length} {activeTab} Photos
              </span>
              {activeTab === 'Physical Exam' && photos.filter(p => p.category === 'Physical Exam' || !p.category).length > 0 && onAnalyzePhotos && (
                <button
                  onClick={onAnalyzePhotos}
                  disabled={isAnalyzing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isAnalyzing 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Icons.Loader className="w-3 h-3" />
                      Analyzing Physical Exam...
                    </>
                  ) : (
                    <>
                      Analyze Physical Exam
                    </>
                  )}
                </button>
              )}
              {activeTab === 'Laboratory' && photos.filter(p => p.category === 'Laboratory').length > 0 && onAnalyzeLabs && (
                <button
                  onClick={onAnalyzeLabs}
                  disabled={isAnalyzingLabs}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isAnalyzingLabs 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100'
                  }`}
                >
                  {isAnalyzingLabs ? (
                    <>
                      <Icons.Loader className="w-3 h-3" />
                      Analyzing Labs...
                    </>
                  ) : (
                    <>
                      Analyze Labs
                    </>
                  )}
                </button>
              )}
              {activeTab === 'Imaging' && photos.filter(p => p.category === 'Imaging').length > 0 && onAnalyzeImaging && (
                <button
                  onClick={onAnalyzeImaging}
                  disabled={isAnalyzingImaging}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isAnalyzingImaging 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100'
                  }`}
                >
                  {isAnalyzingImaging ? (
                    <>
                      <Icons.Loader className="w-3 h-3" />
                      Analyzing Imaging...
                    </>
                  ) : (
                    <>
                      Analyze Imaging
                    </>
                  )}
                </button>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-100 bg-white flex-shrink-0">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === category 
                  ? 'border-teal-600 text-teal-700' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {category === 'Physical Exam' ? 'Physical Exam' : category === 'Laboratory' ? 'Labs' : 'Imaging'}
            </button>
          ))}
        </div>

        {/* Gallery Area / Drop Zone */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
          <FileDropZone 
            onFilesSelected={processFiles}
            onCameraClick={() => setIsCameraOpen(true)}
            accept="image/*"
            label={`Click to upload or drag and drop ${activeTab.toLowerCase()} photos`}
            subLabel="Supports PNG, JPG, JPEG"
            className="mb-6"
          />

          {photos.filter(p => p.category === activeTab || (!p.category && activeTab === 'Physical Exam')).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => {
                // Only show photos for the active tab
                if (photo.category !== activeTab && (photo.category || activeTab !== 'Physical Exam')) return null;
                
                return (
                  <div key={index} className="group relative aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={(photo.file && photo.previewUrl) ? photo.previewUrl : `data:${photo.mimeType};base64,${photo.base64}`} 
                      alt={`Clinical photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => openAttachment(photo)}
                        className="p-2 bg-white rounded-full text-slate-900 hover:text-teal-600 transition-colors mr-2 cursor-pointer"
                        title="View Full Size"
                      >
                        <Icons.ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10 duration-150 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Icons.Close className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Icons.Image}
              title={`No ${activeTab.toLowerCase()} photos`}
              description={`Attach images to back up your documentation for ${activeTab.toLowerCase()}`}
            />
          )}
        </div>
      </ModalShell>

      <CameraCaptureModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(file) => processFiles([file])} 
      />
    </>
  );
};

export default PhotoGalleryModal;
