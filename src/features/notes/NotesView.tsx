import React, { useState, useMemo, useEffect } from "react";
import { PatientNote, MedicalChartResponse } from "../../types";
import { Icons } from "../../components/ui/Icons";
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
import ConfirmationModal from "../../components/dialogs/ConfirmationModal";
import PatientNoteCard from "./components/PatientNoteCard";
import { getLocalDateTimeParts, getTodayDate } from "../../utils/date";
import { createId } from "../../utils/ids";
import DateRangeFields from "../../components/ui/DateRangeFields";
import { filterAndSortNotes, paginateNotes } from "./listing";

interface NotesViewProps {
  notes: PatientNote[];
  onUpdateNotes: (notes: PatientNote[]) => void;
  chartContext?: MedicalChartResponse;
}

const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onUpdateNotes,
  chartContext,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  const today = getTodayDate();

  // Filter and Sort Notes
  const filteredNotes = useMemo(() => {
    return filterAndSortNotes(notes, {
      searchQuery,
      sortOrder,
      startDate,
      endDate,
    });
  }, [notes, searchQuery, sortOrder, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const paginatedNotes = useMemo(() => {
    return paginateNotes(filteredNotes, currentPage, itemsPerPage);
  }, [filteredNotes, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, sortOrder, startDate, endDate]);

  const handleAddNote = () => {
    const id = createId();
    const { date, time } = getLocalDateTimeParts();
    const formattedDate = `${date} ${time}`;

    const newNote: PatientNote = {
      id,
      content: "",
      createdAt: formattedDate,
      updatedAt: formattedDate,
    };

    onUpdateNotes([newNote, ...notes]);
    setNewNoteId(id);
    setCurrentPage(1);
    setSortOrder("newest");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const handleUpdateNote = (updatedNote: PatientNote) => {
    onUpdateNotes(
      notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
    );
    if (newNoteId === updatedNote.id) {
      setNewNoteId(null);
    }
  };

  const handleDeleteNote = () => {
    if (noteIdToDelete) {
      onUpdateNotes(notes.filter((n) => n.id !== noteIdToDelete));
      if (newNoteId === noteIdToDelete) {
        setNewNoteId(null);
      }
      setNoteIdToDelete(null);
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
    setItemsPerPage(10);
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const notesText = filteredNotes
      .map((note) => {
        return `### ${note.title || "Untitled Note"} (${note.createdAt})\n${note.content}`;
      })
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(notesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeAdvancedFilterCount =
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (itemsPerPage !== 10 ? 1 : 0) +
    (sortOrder !== "newest" ? 1 : 0);

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

              <ToolbarCount count={filteredNotes.length} label="Notes" />

              <div className="flex items-center gap-1 sm:gap-2 sm:flex-1 w-32 sm:w-auto relative">
                <ToolbarSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search notes..."
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
                onClick={handleAddNote}
                icon={Icons.Plus}
                label="Add Note"
                hideLabelOnMobile={true}
              />

              <ToolbarButton
                onClick={handleCopy}
                icon={copied ? Icons.Check : Icons.Copy}
                label={copied ? "Copied" : "Copy Notes"}
                variant={copied ? "success" : "secondary"}
                hideLabelOnMobile={true}
              />
            </div>
          </div>

          {isFilterExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-neutral-50 bg-canvas/30 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-5 items-end gap-4">
                <DateRangeFields
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  maxDate={today}
                  className="col-span-2"
                />

                <ToolbarSelect
                  label="Page Size"
                  value={itemsPerPage}
                  onChange={(val) => setItemsPerPage(Number(val))}
                  options={[
                    { value: 10, label: "10 items" },
                    { value: 20, label: "20 items" },
                    { value: 40, label: "40 items" },
                  ]}
                />

                <ToolbarSelect
                  label="Sort Order"
                  value={sortOrder}
                  onChange={(val) => setSortOrder(val as "newest" | "oldest")}
                  options={[
                    { value: "newest", label: "Newest First" },
                    { value: "oldest", label: "Oldest First" },
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

        {/* Notes List */}
        <div className="space-y-6 mt-6">
          {paginatedNotes.length > 0 ? (
            paginatedNotes.map((note) => (
              <PatientNoteCard
                key={note.id}
                note={note}
                onUpdate={handleUpdateNote}
                onDelete={() => setNoteIdToDelete(note.id)}
                isNew={note.id === newNoteId}
                searchQuery={searchQuery}
                chartContext={chartContext}
              />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-surface rounded-3xl border border-dashed border-border-default">
              <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                <Icons.Edit3 className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-content-strong font-bold">No notes found</h3>
              <p className="text-content-secondary text-sm mt-1 max-w-xs">
                {searchQuery
                  ? "No notes match your search criteria"
                  : "Start by adding your first note"}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddNote}
                  className="mt-6 px-6 py-2.5 bg-action text-white rounded-xl text-sm font-bold hover:bg-action-hover transition-all flex items-center gap-2"
                >
                  <Icons.Plus className="w-4 h-4" />
                  Add Note
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Placed outside animated container */}
      <ConfirmationModal
        isOpen={!!noteIdToDelete}
        onClose={() => setNoteIdToDelete(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note?"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete Note"
        variant="danger"
        icon={Icons.Trash}
      />
    </>
  );
};

export default NotesView;
