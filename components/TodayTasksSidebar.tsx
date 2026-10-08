import React from "react";
import {
  PatientOrder,
  OrderStatus,
  ViewMode,
  MedicalChartResponse,
} from "../types";
import { Icons } from "./ui/Icons";
import OrderStatusDropdown from "./ui/OrderStatusDropdown";
import { motion, AnimatePresence } from "motion/react";
import { getLocalDateString, getTodayLocalDateString } from "../utils/date";

interface TodayTasksSidebarProps {
  patients: MedicalChartResponse[];
  onUpdateOrder: (patientId: string, updatedOrder: PatientOrder) => void;
  onSelectPatient: (id: string, initialView?: ViewMode) => void;
}

const TodayTasksSidebar: React.FC<TodayTasksSidebarProps> = ({
  patients,
  onUpdateOrder,
  onSelectPatient,
}) => {
  const todayStr = getTodayLocalDateString();

  const groupedTodayOrders = React.useMemo(() => {
    const groups: Record<
      string,
      { patientId: string; patientName: string; orders: PatientOrder[] }
    > = {};

    patients.forEach((patient) => {
      if (patient.orders) {
        const patientTodayOrders = patient.orders.filter(
          (order) => getLocalDateString(order.targetDate) === todayStr,
        );
        if (patientTodayOrders.length > 0) {
          groups[patient.id] = {
            patientId: patient.id,
            patientName: patient.patientInfo.patientName,
            orders: patientTodayOrders.sort((a, b) =>
              a.targetDate.localeCompare(b.targetDate),
            ),
          };
        }
      }
    });

    return Object.values(groups).sort((a, b) =>
      a.patientName.localeCompare(b.patientName),
    );
  }, [patients, todayStr]);

  const totalTodayOrdersCount = React.useMemo(() => {
    return groupedTodayOrders.reduce(
      (acc, group) => acc + group.orders.length,
      0,
    );
  }, [groupedTodayOrders]);

  const doneTodayOrdersCount = React.useMemo(() => {
    return groupedTodayOrders.reduce(
      (acc, group) =>
        acc + group.orders.filter((o) => o.status === OrderStatus.DONE).length,
      0,
    );
  }, [groupedTodayOrders]);

  const [expandedPatients, setExpandedPatients] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedOrders, setExpandedOrders] = React.useState<
    Record<string, boolean>
  >({});

  const togglePatientExpand = (patientId: string) => {
    setExpandedPatients((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Initialize all patients as expanded by default
  React.useEffect(() => {
    setExpandedPatients((prev) => {
      const newExpanded = { ...prev };
      let changed = false;
      groupedTodayOrders.forEach((group) => {
        if (newExpanded[group.patientId] === undefined) {
          newExpanded[group.patientId] = true;
          changed = true;
        }
      });
      return changed ? newExpanded : prev;
    });
  }, [groupedTodayOrders]);

  return (
    <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 self-start">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <Icons.Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Today's Tasks
            </p>
          </div>
          <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {doneTodayOrdersCount} / {totalTodayOrdersCount}
          </span>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {groupedTodayOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Icons.Check className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                All caught up!
              </p>
            </div>
          ) : (
            groupedTodayOrders.map((group) => (
              <div key={group.patientId} className="space-y-2">
                <div
                  className="flex items-center justify-between group/header cursor-pointer hover:bg-slate-50/50 p-1 -m-1 rounded-lg transition-colors"
                  onClick={() => togglePatientExpand(group.patientId)}
                >
                  <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-tighter truncate">
                    <Icons.ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${expandedPatients[group.patientId] ? "" : "-rotate-90"}`}
                    />
                    <span className="truncate">{group.patientName}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(group.patientId, ViewMode.ORDERS);
                    }}
                    className="p-1 text-slate-300 hover:text-teal-600 transition-colors"
                    title="View in Orders"
                  >
                    <Icons.ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {expandedPatients[group.patientId] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {group.orders.map((order, idx) => {
                        const time = new Date(
                          order.targetDate,
                        ).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        });
                        const prevOrder =
                          idx > 0 ? group.orders[idx - 1] : null;
                        const nextOrder =
                          idx < group.orders.length - 1
                            ? group.orders[idx + 1]
                            : null;
                        const isGroupedWithPrev =
                          order.groupId && prevOrder?.groupId === order.groupId;
                        const isGroupedWithNext =
                          order.groupId && nextOrder?.groupId === order.groupId;

                        return (
                          <div
                            key={order.id}
                            className={`flex items-center gap-2 p-2 transition-all group/item relative
                              ${isGroupedWithPrev ? "mt-0 pt-0 border-t-0 rounded-t-none" : "mt-1 rounded-t-xl border border-slate-50"}
                              ${isGroupedWithNext ? "mb-0 pb-0 border-b-0 rounded-b-none" : "mb-1 rounded-b-xl border border-slate-50"}
                              hover:border-teal-100 hover:bg-teal-50/20
                            `}
                          >
                            {/* Grouping Connector Line */}
                            {order.groupId && (
                              <div className="absolute left-[34px] top-0 bottom-0 w-px bg-slate-100 z-0">
                                {isGroupedWithPrev && isGroupedWithNext && (
                                  <div className="absolute inset-0 bg-slate-100"></div>
                                )}
                                {!isGroupedWithPrev && isGroupedWithNext && (
                                  <div className="absolute top-1/2 bottom-0 bg-slate-100"></div>
                                )}
                                {isGroupedWithPrev && !isGroupedWithNext && (
                                  <div className="absolute top-0 bottom-1/2 bg-slate-100"></div>
                                )}
                              </div>
                            )}

                            <div className="shrink-0 w-20 relative z-10">
                              <OrderStatusDropdown
                                status={order.status}
                                onChange={(newStatus) =>
                                  onUpdateOrder(group.patientId, {
                                    ...order,
                                    status: newStatus,
                                  })
                                }
                                isDesktop={true}
                                className="h-6"
                              />
                            </div>
                            <div className="flex-1 min-w-0 relative z-10 flex items-center gap-1.5">
                              {order.groupId && (
                                <Icons.Layers className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                              )}
                              <p
                                onClick={() => toggleOrderExpand(order.id)}
                                title={order.name}
                                className={`text-[11px] font-bold cursor-pointer transition-all ${
                                  expandedOrders[order.id]
                                    ? "whitespace-normal break-words"
                                    : "truncate"
                                } ${order.status === OrderStatus.DONE ? "line-through text-slate-400" : "text-slate-900"}`}
                              >
                                {order.name}
                              </p>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0 relative z-10">
                              {time}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayTasksSidebar;
