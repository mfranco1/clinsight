import React, { useState, useMemo, useEffect } from "react";
import { CourseEvent, Encounter } from "../../types";
import { Icons } from "../../components/ui/Icons";
import ConfirmationModal from "../../components/ui/modals/ConfirmationModal";
import StickyToolbar from "../../components/ui/StickyToolbar";
import {
  ToolbarCount,
  ToolbarSearch,
  ToolbarFilterToggle,
  ToolbarButton,
  ToolbarPagination,
  ToolbarSeparator,
  ToolbarSelect,
} from "../../components/ui/ToolbarSections";

import EditableTextArea from "../../components/ui/EditableTextArea";

interface CourseViewProps {
  events: CourseEvent[];
  encounters?: Encounter[];
  onUpdateEvents?: (events: CourseEvent[]) => void;
  onAddEvent?: () => void;
}

const CourseView: React.FC<CourseViewProps> = ({
  events,
  encounters,
  onUpdateEvents,
  onAddEvent,
}) => {
  const [copied, setCopied] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedEventId, setCopiedEventId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // Filter Visibility State
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Sort events by date/time (descending - most recent first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return timeB.localeCompare(timeA);
    });
  }, [events]);

  const handleUpdateEvent = (
    index: number,
    field: keyof CourseEvent,
    value: string,
  ) => {
    // Find the event in the filtered/sorted dataset that matches index
    const eventToUpdate = filteredEvents[index];
    const originalIndex = events.findIndex((e) => e === eventToUpdate);

    if (originalIndex !== -1) {
      const updatedEvents = [...events];
      updatedEvents[originalIndex] = {
        ...updatedEvents[originalIndex],
        [field]: value,
      };
      onUpdateEvents?.(updatedEvents);
    }
  };

  // Filter events by date range and search query
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      // Date Filter
      const eventDate = new Date(event.date).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      const matchesDate = eventDate >= start && eventDate <= end;

      // Search Filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        event.event.toLowerCase().includes(query) ||
        event.details.toLowerCase().includes(query) ||
        event.date.includes(query);

      return matchesDate && matchesSearch;
    });
  }, [sortedEvents, startDate, endDate, searchQuery]);

  // Paginate events
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatForClipboard = (eventList: CourseEvent[]) => {
    let text = "HOSPITAL COURSE TIMELINE\n\n";
    if (eventList.length === 0) return text + "No specific events recorded.";

    eventList.forEach((item) => {
      text += `${item.date}${item.time ? ` @ ${item.time}` : ""} - ${item.event}\n`;
      text += `${item.details}\n\n`;
    });
    return text;
  };

  const handleCopy = () => {
    const text = formatForClipboard(filteredEvents);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEvent = (item: CourseEvent, index: number) => {
    const text = `${item.date}${item.time ? ` @ ${item.time}` : ""} - ${item.event}\n${item.details}`;
    navigator.clipboard.writeText(text);
    setCopiedEventId(index);
    setTimeout(() => setCopiedEventId(null), 1500);
  };

  const handleDeleteEvent = () => {
    if (eventToDelete !== null) {
      const eventToRemove = paginatedEvents[eventToDelete];
      const originalIndex = events.findIndex((e) => e === eventToRemove);
      if (originalIndex !== -1) {
        const newEvents = [...events];
        newEvents.splice(originalIndex, 1);
        onUpdateEvents?.(newEvents);
      }
      setEventToDelete(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Calculate active filter count (excluding basic search)
  const activeAdvancedFilterCount = (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 animate-slide-up-fade">
        <StickyToolbar>
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 min-h-[52px] overflow-x-auto no-scrollbar max-w-full gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0">
              <ToolbarPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />

              <ToolbarSeparator className="hidden sm:block" />

              <ToolbarCount count={filteredEvents.length} label="Events" />

              <div className="flex items-center gap-1 sm:gap-2 sm:flex-1 w-32 sm:w-auto relative">
                <ToolbarSearch
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search clinical events..."
                  className="w-full flex"
                />
              </div>

              <ToolbarFilterToggle
                isExpanded={isFilterExpanded}
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                activeCount={activeAdvancedFilterCount}
                hideLabelOnMobile={true}
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ToolbarSeparator className="hidden sm:block" />

              <ToolbarButton
                onClick={() => onAddEvent?.()}
                icon={Icons.Plus}
                label="Add Event"
                hideLabelOnMobile={true}
              />

              <ToolbarButton
                onClick={handleCopy}
                icon={copied ? Icons.Check : Icons.Copy}
                label={copied ? "Copied" : "Copy Timeline"}
                variant={copied ? "success" : "secondary"}
                hideLabelOnMobile={true}
              />
            </div>
          </div>

          {isFilterExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/30 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 items-end gap-4">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={today}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 bg-white rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 shadow-sm transition-all w-full h-[31px]"
                  />
                </div>

                <ToolbarSelect
                  label="Page Size"
                  value={itemsPerPage}
                  onChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 10, label: "10 items" },
                    { value: 20, label: "20 items" },
                    { value: 40, label: "40 items" },
                  ]}
                />

                <ToolbarButton
                  onClick={resetFilters}
                  icon={Icons.Refresh}
                  label="Reset"
                  variant="secondary"
                  className="h-[31px] justify-center"
                />
              </div>
            </div>
          )}
        </StickyToolbar>

        <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 pb-4">
          {paginatedEvents.map((item, idx) => {
            const uniqueId = (currentPage - 1) * itemsPerPage + idx;
            const isCopied = copiedEventId === uniqueId;

            return (
              <div
                key={`${item.date}-${idx}`}
                className="relative pl-8 sm:pl-12 group animate-fade-in"
              >
                {/* Dot on timeline */}
                <div className="absolute -left-[9px] top-1.5 h-[18px] w-[18px] rounded-full border-4 border-white bg-teal-500 shadow-sm group-hover:bg-teal-600 group-hover:scale-110 transition-all duration-200 z-10"></div>

                {/* Encounter Transition Marker */}
                {idx === 0 ||
                paginatedEvents[idx - 1].encounterId !== item.encounterId ? (
                  <div className="absolute -left-[100px] top-1 w-[80px] text-right hidden md:block">
                    {(() => {
                      const enc = encounters?.find(
                        (e) => e.id === item.encounterId,
                      );
                      const label = enc
                        ? enc.type === "ADMISSION"
                          ? "Admission"
                          : "Consult"
                        : "Legacy";
                      return (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {label}
                          </span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">
                            {new Date(item.date).getFullYear()}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                  <span className="text-xs font-bold text-teal-700 tracking-wide uppercase font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block mb-2 sm:mb-0 shadow-sm">
                    {item.date}{" "}
                    {item.time && (
                      <span className="text-teal-600/70 font-medium ml-1">
                        • {item.time}
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    value={item.event}
                    onChange={(e) =>
                      handleUpdateEvent(uniqueId, "event", e.target.value)
                    }
                    className="text-xs font-bold text-slate-800 sm:ml-4 bg-transparent border-none focus:ring-2 focus:ring-teal-500 rounded px-1 flex-1 outline-none text-right"
                  />
                </div>

                <div className="bg-white py-3 pl-6 pr-2 rounded-2xl border border-slate-200 shadow-sm group-hover:border-teal-200 group-hover:shadow-md transition-all duration-200 relative flex items-start gap-1 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <EditableTextArea
                      value={item.details}
                      onSave={(val) => {
                        handleUpdateEvent(uniqueId, "details", val);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                      onChange={(val) =>
                        handleUpdateEvent(uniqueId, "details", val)
                      }
                      placeholder="Enter event details..."
                      className="text-xs"
                      isEditing={editingId === uniqueId}
                      setIsEditing={(val) =>
                        setEditingId(val ? uniqueId : null)
                      }
                      hideEditButton={true}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-0.5 transition-all flex-shrink-0 pt-0.5">
                    <button
                      onClick={() => handleCopyEvent(item, uniqueId)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                      title="Copy event details"
                    >
                      <Icons.Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(uniqueId)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                      title="Edit event"
                    >
                      <Icons.Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEventToDelete(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete event"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Copied Flag */}
                  {isCopied && (
                    <div className="absolute top-3 right-12 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm animate-fade-in-up flex items-center z-20 whitespace-nowrap">
                      <Icons.Check className="w-3 h-3 mr-1" />
                      Copied
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="pl-12 text-slate-400 italic py-16 text-center">
              No clinical events found matching your current filter criteria.
            </div>
          )}
        </div>

        <div className="h-12"></div>
      </div>

      {/* Delete Confirmation Modal - Placed outside animated container */}
      <ConfirmationModal
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Clinical Event?"
        message="Are you sure you want to remove this event from the patient's timeline? This action cannot be undone."
        confirmLabel="Delete Event"
        variant="danger"
        icon={Icons.Trash}
      />
    </>
  );
};

export default CourseView;
