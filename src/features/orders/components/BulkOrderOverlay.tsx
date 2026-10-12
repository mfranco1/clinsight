import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Icons } from "../../../components/ui/Icons";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import { PatientOrder, OrderStatus } from "../../../types";
import { getTodayLocalDateString } from "../../../utils/date";
import { parseBulkOrdersText } from "../../../domain/orders";
import ModalShell from "../../../components/ui/ModalShell";

interface BulkOrderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrders: (orders: PatientOrder[]) => void;
}

const BulkOrderOverlay: React.FC<BulkOrderOverlayProps> = ({
  isOpen,
  onClose,
  onAddOrders,
}) => {
  const [inputText, setInputText] = useState("");
  const [defaultDate, setDefaultDate] = useState(getTodayLocalDateString());
  const [defaultCategory, setDefaultCategory] = useState<string>("Other");
  const [defaultStatus, setDefaultStatus] = useState<OrderStatus>(
    OrderStatus.PENDING,
  );

  // Parse bulk orders using shared domain logic
  const parsedOrders = useMemo(() => {
    return parseBulkOrdersText({
      inputText,
      defaultDate,
      defaultCategory,
      defaultStatus,
    });
  }, [inputText, defaultDate, defaultCategory, defaultStatus]);

  const handleCommit = () => {
    if (parsedOrders.length > 0) {
      onAddOrders(parsedOrders);
      setInputText("");
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleCommit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, parsedOrders]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Orders"
      icon={Icons.ListPlus}
      iconBgColor="bg-action-subtle text-action"
      size="full"
      className="h-[100dvh] max-h-none w-full max-w-full rounded-none border-0 sm:h-[600px] sm:max-h-[calc(100vh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-4xl sm:rounded-2xl sm:border"
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
      footerActions={
        <>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 text-sm font-bold text-content-secondary transition-colors hover:text-neutral-800 sm:flex-none"
          >
            Cancel
          </button>
          <button
            onClick={handleCommit}
            disabled={parsedOrders.length === 0}
            className="flex-1 rounded-xl bg-action px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-action-500/20 transition-all hover:bg-action-hover active:scale-95 disabled:opacity-50 disabled:shadow-none sm:flex-none"
          >
            Add Orders
          </button>
        </>
      }
    >
      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left: Input */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 border-b md:border-b-0 md:border-r border-border-subtle bg-canvas/30 min-h-[300px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-6">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider whitespace-nowrap">
                Default Status
              </span>
              <select
                value={defaultStatus}
                onChange={(e) =>
                  setDefaultStatus(e.target.value as OrderStatus)
                }
                className="text-[11px] border border-border-default rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-focus-ring/20 focus:border-action bg-surface shadow-sm transition-all font-bold text-content-primary"
              >
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider whitespace-nowrap">
                Default Date
              </span>
              <input
                type="date"
                value={defaultDate}
                onChange={(e) => setDefaultDate(e.target.value)}
                className="text-[11px] border border-border-default rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-focus-ring/20 focus:border-action bg-surface shadow-sm transition-all flex-1 sm:flex-none min-w-0"
              />
            </div>
          </div>
          <EditableTextArea
            value={inputText}
            onChange={setInputText}
            autoFocus
            isEditing={true}
            showControls={false}
            editorMode="source"
            minHeight="min-h-[200px]"
            placeholder={`Example:\nPROCS\n[] CBC - 3/30\n[] Na K Cl Mg BUN Crea\n\nIMAGING\n[] Chest X-Ray\n\nBLOOD\n> 1u pRBC\n> Crossmatch`}
            className="flex-1 w-full bg-surface text-sm font-mono text-content-primary shadow-inner leading-relaxed"
          />
        </div>

        {/* Right: Preview */}
        <div className="w-full md:w-[320px] flex flex-col p-4 sm:p-6 bg-surface overflow-hidden border-t md:border-t-0 border-border-subtle h-[250px] md:h-auto">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[11px] font-black text-content-muted uppercase tracking-[0.2em]">
              Preview
            </label>
            <span className="px-2 py-0.5 bg-action-subtle text-action text-[9px] font-black rounded-full uppercase tracking-wider">
              {parsedOrders.length} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
            {parsedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                  <Icons.ClipboardList className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-xs font-bold text-content-muted">
                  Start typing to see
                  <br />
                  parsed orders here
                </p>
              </div>
            ) : (
              parsedOrders.map((order, idx) => {
                const prevOrder = idx > 0 ? parsedOrders[idx - 1] : null;
                const nextOrder =
                  idx < parsedOrders.length - 1 ? parsedOrders[idx + 1] : null;
                const isGroupedWithPrev =
                  order.groupId && prevOrder?.groupId === order.groupId;
                const isGroupedWithNext =
                  order.groupId && nextOrder?.groupId === order.groupId;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    className={`p-3 transition-all relative
                            ${isGroupedWithPrev ? "mt-0 pt-1 border-t-0 rounded-t-none" : "mt-2 rounded-t-xl border border-border-subtle bg-canvas/50"}
                            ${isGroupedWithNext ? "mb-0 pb-1 border-b-0 rounded-b-none" : "mb-1 rounded-b-xl border border-border-subtle bg-canvas/50"}
                            hover:bg-surface hover:border-action-100 hover:shadow-md hover:shadow-action-500/5
                          `}
                  >
                    {/* Grouping Connector Line */}
                    {order.groupId && (
                      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-neutral-200 z-0">
                        {isGroupedWithPrev && isGroupedWithNext && (
                          <div className="absolute inset-0 bg-neutral-200"></div>
                        )}
                        {!isGroupedWithPrev && isGroupedWithNext && (
                          <div className="absolute top-1/2 bottom-0 bg-neutral-200"></div>
                        )}
                        {isGroupedWithPrev && !isGroupedWithNext && (
                          <div className="absolute top-0 bottom-1/2 bg-neutral-200"></div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-2 min-w-0">
                        {order.groupId && (
                          <Icons.Layers
                            className={`w-3 h-3 shrink-0 text-content-muted`}
                          />
                        )}
                        <span className="text-xs font-bold text-neutral-800 leading-tight truncate">
                          {order.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-[8px] font-black text-action uppercase tracking-wider bg-action-subtle px-1.5 py-0.5 rounded-md">
                        {order.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-content-muted font-bold uppercase tracking-wider mt-1 ml-5 relative z-10">
                      <div className="flex items-center gap-1">
                        <Icons.Clock className="w-3 h-3 text-neutral-300" />
                        {new Date(order.targetDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                        {(new Date(order.targetDate).getHours() !== 0 ||
                          new Date(order.targetDate).getMinutes() !== 0) && (
                          <span className="ml-1 text-action">
                            {new Date(order.targetDate).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default BulkOrderOverlay;
