import React, { useState, useMemo } from "react";
import { useRetainedState } from "../../app/ViewState";
import { createPortal } from "react-dom";
import {
  PatientOrder,
  OrderCategory,
  OrderStatus,
  OrderStatusFilter,
  MedicationOrder,
  MedicationStatus,
  GeneralData,
  Encounter,
} from "../../types";
import { Icons } from "../../components/ui/Icons";
import { motion, AnimatePresence } from "motion/react";
import StickyToolbar from "../../components/ui/StickyToolbar";
import {
  ToolbarCount,
  ToolbarSearch,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSelect,
  ToolbarFilterToggle,
} from "../../components/ui/ToolbarSections";
import PatientOrderCard from "./components/PatientOrderCard";
import MedicationOrderRow from "./components/MedicationOrderRow";
import BulkOrderOverlay from "./components/BulkOrderOverlay";
import PrescriptionModal from "./components/PrescriptionModal";
import ConfirmationModal from "../../components/dialogs/ConfirmationModal";
import { getLocalDateString } from "../../utils/date";
import { createId } from "../../utils/ids";
import {
  createDiagnosticOrder,
  createMedicationOrder,
  filterOrders,
  filterMedications,
  groupOrdersByTargetDate,
  cleanupGroups,
} from "../../domain/orders";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface OrdersViewProps {
  patientId: string;
  orders: PatientOrder[];
  medications: MedicationOrder[];
  encounters?: Encounter[];
  onUpdateOrders: (orders: PatientOrder[]) => void;
  onUpdateMedications: (meds: MedicationOrder[]) => void;
  patientInfo: GeneralData;
}

type OrdersTab = "DIAGNOSTICS" | "MEDICATIONS";

const OrdersView: React.FC<OrdersViewProps> = ({
  patientId,
  orders,
  medications,
  encounters,
  onUpdateOrders,
  onUpdateMedications,
  patientInfo,
}) => {
  const stateKey = `patient:${patientId}:orders:`;
  const [activeTab, setActiveTab] = useRetainedState<OrdersTab>(
    `${stateKey}tab`,
    "DIAGNOSTICS",
  );
  const [searchQuery, setSearchQuery] = useRetainedState(
    `${stateKey}search`,
    "",
  );
  const [statusFilter, setStatusFilter] = useRetainedState<OrderStatusFilter>(
    `${stateKey}status`,
    "ALL",
  );
  const [typeFilter, setTypeFilter] = useRetainedState<OrderCategory | "ALL">(
    `${stateKey}type`,
    "ALL",
  );
  const [encounterFilter, setEncounterFilter] = useRetainedState(
    `${stateKey}encounter`,
    "ALL",
  );
  const [startDate, setStartDate] = useRetainedState(
    `${stateKey}start-date`,
    "",
  );
  const [endDate, setEndDate] = useRetainedState(`${stateKey}end-date`, "");
  const [isFilterExpanded, setIsFilterExpanded] = useRetainedState(
    `${stateKey}filter-expanded`,
    false,
  );
  const [isBulkOverlayOpen, setIsBulkOverlayOpen] = useState(false);
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [newMedId, setNewMedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const dispatchOrders = (newOrders: PatientOrder[]) => {
    onUpdateOrders(cleanupGroups(newOrders));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Diagnostics Logic ---
  const categories = useMemo(() => {
    const cats = new Set<string>();
    orders.forEach((o) => {
      if (o.category) cats.add(o.category);
    });
    return Array.from(cats).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, {
      searchQuery,
      statusFilter,
      typeFilter,
      encounterFilter,
      startDate,
      endDate,
    });
  }, [
    orders,
    searchQuery,
    statusFilter,
    typeFilter,
    encounterFilter,
    startDate,
    endDate,
  ]);

  const groupedOrders = useMemo(() => {
    return groupOrdersByTargetDate(filteredOrders);
  }, [filteredOrders]);

  const handleAddOrder = () => {
    const newOrder = createDiagnosticOrder();
    dispatchOrders([newOrder, ...orders]);
    setNewOrderId(newOrder.id);
  };

  // --- Therapeutics Logic ---
  const filteredMeds = useMemo(() => {
    return filterMedications(medications, {
      searchQuery,
      statusFilter,
      encounterFilter,
    });
  }, [medications, searchQuery, statusFilter, encounterFilter]);

  const handleAddMed = () => {
    const newMed = createMedicationOrder();
    onUpdateMedications([newMed, ...medications]);
    setNewMedId(newMed.id);
  };

  const handleDeleteMed = (id: string) => {
    onUpdateMedications(medications.filter((m) => m.id !== id));
  };

  const handleUpdateMed = (updatedMed: MedicationOrder) => {
    onUpdateMedications(
      medications.map((m) => (m.id === updatedMed.id ? updatedMed : m)),
    );
  };

  const handleUpdateOrders = (newOrders: PatientOrder[]) => {
    dispatchOrders(newOrders);
  };

  // --- Common Handlers ---
  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setEncounterFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (typeFilter !== "ALL" && activeTab === "DIAGNOSTICS") count++;
    if (encounterFilter !== "ALL") count++;
    if (startDate && activeTab === "DIAGNOSTICS") count++;
    if (endDate && activeTab === "DIAGNOSTICS") count++;
    return count;
  }, [
    statusFilter,
    typeFilter,
    encounterFilter,
    startDate,
    endDate,
    activeTab,
  ]);

  const handleMarkDateDone = (date: string, isDone: boolean) => {
    const updatedOrders = orders.map((order) => {
      if (getLocalDateString(order.targetDate) === date) {
        return {
          ...order,
          status: isDone ? OrderStatus.DONE : OrderStatus.PENDING,
        };
      }
      return order;
    });
    dispatchOrders(updatedOrders);
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const handleToggleSelectMed = (medId: string) => {
    setSelectedMedIds((prev) =>
      prev.includes(medId)
        ? prev.filter((id) => id !== medId)
        : [...prev, medId],
    );
  };

  const handleBulkDelete = () => {
    if (activeTab === "DIAGNOSTICS") {
      onUpdateOrders(orders.filter((o) => !selectedOrderIds.includes(o.id)));
      setSelectedOrderIds([]);
    } else {
      onUpdateMedications(
        medications.filter((m) => !selectedMedIds.includes(m.id)),
      );
      setSelectedMedIds([]);
    }
    setIsSelectMode(false);
  };

  const handleGroupOrders = () => {
    if (selectedOrderIds.length < 2) return;

    const groupId = createId("group");

    // Find latest target date
    const selectedOrdersList = orders.filter((o) =>
      selectedOrderIds.includes(o.id),
    );
    const latestTimestamp = Math.max(
      ...selectedOrdersList.map((o) => new Date(o.targetDate).getTime()),
    );
    const latestDate = new Date(latestTimestamp).toISOString();

    // Map updated orders and update dates to cluster them
    const updatedOrders = orders.map((order) =>
      selectedOrderIds.includes(order.id)
        ? { ...order, groupId, targetDate: latestDate }
        : order,
    );

    // Grouping: move selected orders to where the target date position is
    const nonSelected = updatedOrders.filter(
      (o) => !selectedOrderIds.includes(o.id),
    );
    const selected = updatedOrders.filter((o) =>
      selectedOrderIds.includes(o.id),
    );

    // Find index of the first order in the original list that has the latest date (or just use the first chronological one)
    // We'll place the group before the first item that matches or follows the latestDate
    let insertIndex = nonSelected.findIndex(
      (o) => new Date(o.targetDate).getTime() <= latestTimestamp,
    );
    if (insertIndex === -1) insertIndex = nonSelected.length;

    const finalOrders = [...nonSelected];
    finalOrders.splice(insertIndex, 0, ...selected);

    dispatchOrders(finalOrders);
    setSelectedOrderIds([]);
    setIsSelectMode(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-12 animate-slide-up-fade">
      {/* Tab Switcher */}
      <div className="flex bg-surface p-1 rounded-xl mb-4 w-fit mx-auto shadow-sm">
        <button
          onClick={() => {
            setActiveTab("DIAGNOSTICS");
            handleResetFilters();
            setIsSelectMode(false);
            setSelectedOrderIds([]);
            setSelectedMedIds([]);
          }}
          className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === "DIAGNOSTICS" ? "bg-action-subtle text-action-hover ring-1 ring-action-100" : "text-content-secondary hover:text-content-primary hover:bg-neutral-200/30"}`}
        >
          <Icons.ClipboardList
            className={`w-3.5 h-3.5 ${activeTab === "DIAGNOSTICS" ? "text-action" : "text-content-muted"}`}
          />
          Diagnostics
        </button>
        <button
          onClick={() => {
            setActiveTab("MEDICATIONS");
            handleResetFilters();
            setIsSelectMode(false);
            setSelectedOrderIds([]);
            setSelectedMedIds([]);
          }}
          className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === "MEDICATIONS" ? "bg-action-subtle text-action-hover ring-1 ring-action-100" : "text-content-secondary hover:text-content-primary hover:bg-neutral-200/30"}`}
        >
          <Icons.Prescription
            className={`w-3.5 h-3.5 ${activeTab === "MEDICATIONS" ? "text-action" : "text-content-muted"}`}
          />
          Medications
        </button>
      </div>

      <StickyToolbar>
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 min-h-[52px] overflow-x-auto no-scrollbar max-w-full gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0">
              <ToolbarCount
                count={
                  activeTab === "DIAGNOSTICS"
                    ? filteredOrders.length
                    : filteredMeds.length
                }
                label="ORDERS"
              />
              <ToolbarSeparator className="hidden sm:block" />
              <div className="flex items-center gap-1 sm:gap-2 sm:flex-1 w-32 sm:w-auto relative">
                <ToolbarSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  className="w-full flex"
                />
              </div>
              <ToolbarFilterToggle
                isExpanded={isFilterExpanded}
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                activeCount={activeFilterCount}
                hideLabelOnMobile={true}
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ToolbarSeparator className="hidden sm:block" />
              {activeTab === "DIAGNOSTICS" ? (
                <>
                  <ToolbarButton
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedOrderIds([]);
                    }}
                    icon={isSelectMode ? Icons.Close : Icons.Check}
                    label={isSelectMode ? "Cancel" : "Select"}
                    variant={isSelectMode ? "secondary" : "ghost"}
                    hideLabelOnMobile={true}
                  />
                  <ToolbarButton
                    onClick={() => setIsBulkOverlayOpen(true)}
                    icon={Icons.ListPlus}
                    label="Bulk Add"
                    hideLabelOnMobile={true}
                  />
                  <ToolbarButton
                    onClick={handleAddOrder}
                    icon={Icons.Plus}
                    label="Add Order"
                    hideLabelOnMobile={true}
                  />
                </>
              ) : (
                <>
                  <ToolbarButton
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedMedIds([]);
                    }}
                    icon={isSelectMode ? Icons.Close : Icons.Check}
                    label={isSelectMode ? "Cancel" : "Select"}
                    variant={isSelectMode ? "secondary" : "ghost"}
                    hideLabelOnMobile={true}
                  />
                  <ToolbarButton
                    onClick={() => setIsRxOpen(true)}
                    icon={Icons.Print}
                    label="Print Rx"
                    variant="secondary"
                    hideLabelOnMobile={true}
                  />
                  <ToolbarButton
                    onClick={handleAddMed}
                    icon={Icons.Plus}
                    label="Add Order"
                    hideLabelOnMobile={true}
                  />
                </>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border-subtle bg-canvas/50"
              >
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <ToolbarSelect
                    label="Status"
                    value={statusFilter}
                    onChange={(value) =>
                      setStatusFilter(value as OrderStatusFilter)
                    }
                    options={[
                      { value: "ALL", label: "All Status" },
                      ...(activeTab === "DIAGNOSTICS"
                        ? Object.values(OrderStatus).map((s) => ({
                            value: s,
                            label: s.charAt(0) + s.slice(1).toLowerCase(),
                          }))
                        : Object.values(MedicationStatus).map((s) => ({
                            value: s,
                            label: s.charAt(0) + s.slice(1).toLowerCase(),
                          }))),
                    ]}
                  />

                  <ToolbarSelect
                    label="Encounter"
                    value={encounterFilter}
                    onChange={setEncounterFilter}
                    options={[
                      { value: "ALL", label: "All Encounters" },
                      ...(encounters || []).map((e) => ({
                        value: e.id,
                        label: `${e.type === "ADMISSION" ? "Admission" : "Consult"} - ${new Date(e.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
                      })),
                    ]}
                  />

                  {activeTab === "DIAGNOSTICS" && (
                    <>
                      <ToolbarSelect
                        label="Type"
                        value={typeFilter}
                        onChange={(value) =>
                          setTypeFilter(value as OrderCategory | "ALL")
                        }
                        options={[
                          { value: "ALL", label: "All Types" },
                          ...categories.map((cat) => ({
                            value: cat,
                            label: cat,
                          })),
                        ]}
                      />
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1 ml-0.5">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="border border-border-default bg-surface rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-focus-ring outline-none h-[31px]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1 ml-0.5">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="border border-border-default bg-surface rounded-lg text-[11px] px-2 py-1.5 focus:ring-1 focus:ring-focus-ring outline-none h-[31px]"
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={handleResetFilters}
                    className="p-1.5 text-content-muted hover:text-action transition-colors self-center mt-4"
                  >
                    <Icons.Refresh className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </StickyToolbar>

      <div className="mt-8">
        {activeTab === "DIAGNOSTICS" ? (
          <div className="bg-surface rounded-3xl border border-border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div
                className={`w-full min-w-full ${filteredOrders.length > 0 ? "md:min-w-[900px]" : ""}`}
              >
                {/* Grid Header */}
                {filteredOrders.length > 0 && (
                  <div className="hidden md:grid md:grid-cols-[120px_1.5fr_100px_120px_1fr_100px_100px] items-center py-3 px-4 gap-4 bg-canvas border-b border-border-subtle">
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest text-center">
                      Status
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Order
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Type
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Schedule
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Notes
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Ordered
                    </div>
                    <div className="text-left text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Actions
                    </div>
                  </div>
                )}
                <div className="divide-y divide-neutral-50">
                  {groupedOrders.length === 0 ? (
                    <EmptyOrders
                      onBulkAdd={() => setIsBulkOverlayOpen(true)}
                      onAdd={handleAddOrder}
                      isFiltered={orders.length > 0}
                    />
                  ) : (
                    groupedOrders.map(([date, dateOrders]) => {
                      const allDone = dateOrders.every(
                        (o) => o.status === OrderStatus.DONE,
                      );
                      return (
                        <div key={date}>
                          <div className="bg-canvas/50 md:grid md:grid-cols-[120px_1.5fr_100px_120px_1fr_100px_100px] items-center py-2 px-4 gap-4 border-y border-border-subtle">
                            <div className="flex justify-center">
                              <button
                                onClick={() =>
                                  handleMarkDateDone(date, !allDone)
                                }
                                className={`w-5 h-5 rounded transition-all flex items-center justify-center border-2 ${allDone ? "bg-action-subtle border-action-500 text-white" : "bg-surface border-border-default hover:border-action-400"}`}
                              >
                                {allDone && <Icons.Check className="w-3 h-3" />}
                              </button>
                            </div>
                            <h3 className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">
                              {new Date(date).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </h3>
                          </div>
                          {dateOrders.map((order, idx) => {
                            const isGroupedWithPrev = !!(
                              idx > 0 &&
                              order.groupId &&
                              order.groupId === dateOrders[idx - 1].groupId
                            );
                            const isGroupedWithNext = !!(
                              idx < dateOrders.length - 1 &&
                              order.groupId &&
                              order.groupId === dateOrders[idx + 1].groupId
                            );

                            return (
                              <PatientOrderCard
                                key={order.id}
                                order={order}
                                onUpdate={(u) =>
                                  dispatchOrders(
                                    orders.map((o) => (o.id === u.id ? u : o)),
                                  )
                                }
                                onDelete={(id) =>
                                  dispatchOrders(
                                    orders.filter((o) => o.id !== id),
                                  )
                                }
                                isNew={order.id === newOrderId}
                                isSelectMode={isSelectMode}
                                isSelected={selectedOrderIds.includes(order.id)}
                                onToggleSelect={() =>
                                  handleToggleSelectOrder(order.id)
                                }
                                isGroupedWithPrev={isGroupedWithPrev}
                                isGroupedWithNext={isGroupedWithNext}
                                onUngroup={() => {
                                  dispatchOrders(
                                    orders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, groupId: undefined }
                                        : o,
                                    ),
                                  );
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div
                className={`w-full min-w-full ${filteredMeds.length > 0 ? "md:min-w-[950px]" : ""}`}
              >
                {/* Grid Header */}
                {filteredMeds.length > 0 && (
                  <div className="hidden md:grid md:grid-cols-[120px_1.5fr_80px_120px_120px_100px_1fr_100px] items-center py-3 px-4 gap-4 bg-canvas border-b border-border-subtle">
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest text-center">
                      Status
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Medication
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Dose
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Route
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Frequency
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Duration
                    </div>
                    <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Sig
                    </div>
                    <div className="text-right text-[10px] font-black text-content-muted uppercase tracking-widest">
                      Actions
                    </div>
                  </div>
                )}
                <div className="divide-y divide-neutral-50">
                  {filteredMeds.length === 0 ? (
                    <EmptyMedications
                      onAdd={handleAddMed}
                      isFiltered={medications.length > 0}
                    />
                  ) : (
                    filteredMeds.map((med) => (
                      <MedicationOrderRow
                        key={med.id}
                        med={med}
                        onUpdate={handleUpdateMed}
                        onDelete={handleDeleteMed}
                        isNew={med.id === newMedId}
                        isSelectMode={isSelectMode}
                        isSelected={selectedMedIds.includes(med.id)}
                        onToggleSelect={() => handleToggleSelectMed(med.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BulkOrderOverlay
        isOpen={isBulkOverlayOpen}
        onClose={() => setIsBulkOverlayOpen(false)}
        onAddOrders={(newO) => dispatchOrders([...newO, ...orders])}
      />

      {/* Multi-Selection Overlay */}
      {(activeTab === "DIAGNOSTICS"
        ? selectedOrderIds.length
        : selectedMedIds.length) >= 2 &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-0 w-full flex justify-center z-50 px-4 pointer-events-none"
            >
              <div className="bg-surface text-content-strong px-3 py-2.5 sm:px-6 sm:py-4 rounded-2xl shadow-2xl flex items-center justify-between sm:justify-start gap-3 sm:gap-6 border border-border-default backdrop-blur-md bg-opacity-95 pointer-events-auto min-w-[280px] sm:min-w-fit max-w-[95vw] sm:max-w-[90vw]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-action-subtle rounded-lg flex items-center justify-center shrink-0">
                    <Icons.Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-action" />
                  </div>
                  <span className="text-[11px] sm:text-sm font-bold tracking-tight text-content-strong whitespace-nowrap">
                    {activeTab === "DIAGNOSTICS"
                      ? selectedOrderIds.length
                      : selectedMedIds.length}{" "}
                    {activeTab === "DIAGNOSTICS" ? "Orders" : "Meds"}
                  </span>
                </div>

                <div className="hidden md:block h-6 w-px bg-neutral-200 shrink-0"></div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {activeTab === "DIAGNOSTICS" && (
                    <button
                      onClick={handleGroupOrders}
                      className="bg-action hover:bg-action-hover text-white px-3 py-2 sm:px-6 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-action-600/20 whitespace-nowrap"
                    >
                      <Icons.Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Group
                    </button>
                  )}

                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="bg-critical-50 hover:bg-critical-100 text-critical-600 px-3 py-2 sm:px-6 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Icons.Trash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Delete
                  </button>
                </div>

                <div className="hidden md:block h-6 w-px bg-neutral-200 shrink-0"></div>

                <button
                  onClick={() => {
                    setSelectedOrderIds([]);
                    setSelectedMedIds([]);
                    setIsSelectMode(false);
                  }}
                  className="text-content-muted hover:text-neutral-800 text-[10px] sm:text-xs font-bold transition-colors whitespace-nowrap px-1 sm:px-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.getElementById("working-view") || document.body,
        )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Confirm Bulk Deletion"
        message={`Are you sure you want to delete the ${activeTab === "DIAGNOSTICS" ? selectedOrderIds.length : selectedMedIds.length} selected ${activeTab.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {isRxOpen &&
        createPortal(
          <PrescriptionModal
            isOpen={isRxOpen}
            onClose={() => setIsRxOpen(false)}
            patientName={patientInfo.patientName}
            patientAddress={patientInfo.address}
            ageSex={patientInfo.ageSex}
            date={new Date().toLocaleDateString()}
            medications={medications}
          />,
          document.body,
        )}
    </div>
  );
};

// --- Supplementary Components ---

const EmptyMedications: React.FC<{
  onAdd: () => void;
  isFiltered: boolean;
}> = ({ onAdd, isFiltered }) => (
  <div className="py-20 flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
      <Icons.Prescription className="w-8 h-8 text-neutral-300" />
    </div>
    <h3 className="text-content-strong font-bold">No medications found</h3>
    <p className="text-content-secondary text-sm mt-1 max-w-xs">
      {isFiltered
        ? "No orders match your search criteria"
        : "Start by adding your first medication"}
    </p>
    {!isFiltered && (
      <button
        onClick={onAdd}
        className="mt-6 px-8 py-3 bg-action text-white rounded-xl text-sm font-bold hover:bg-action-hover shadow-lg shadow-action-500/20 flex items-center gap-2 transition-all active:scale-95"
      >
        <Icons.Plus className="w-4 h-4" /> Add Medication
      </button>
    )}
  </div>
);

const EmptyOrders: React.FC<{
  onBulkAdd: () => void;
  onAdd: () => void;
  isFiltered: boolean;
}> = ({ onBulkAdd, onAdd, isFiltered }) => (
  <div className="py-20 flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
      <Icons.ClipboardList className="w-8 h-8 text-neutral-300" />
    </div>
    <h3 className="text-content-strong font-bold">No orders found</h3>
    <p className="text-content-secondary text-sm mt-1 max-w-xs">
      {isFiltered
        ? "No orders match your search criteria"
        : "Start by adding your first order"}
    </p>
    {!isFiltered && (
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={onBulkAdd}
          className="px-6 py-2.5 bg-action text-white rounded-xl text-sm font-bold hover:bg-action-hover transition-all flex items-center gap-2 shadow-lg shadow-action-500/20"
        >
          <Icons.ListPlus className="w-4 h-4" /> Bulk Add
        </button>
        <button
          onClick={onAdd}
          className="px-6 py-2.5 bg-surface text-content-default border border-border-default rounded-xl text-sm font-bold hover:bg-canvas transition-all flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" /> Add Order
        </button>
      </div>
    )}
  </div>
);

export default OrdersView;
