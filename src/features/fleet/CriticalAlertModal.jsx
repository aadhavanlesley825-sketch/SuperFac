import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, X } from "lucide-react";
import { useFleetStore } from "../../lib/stores/fleetStore.js";

/* ------------------------------------------------------------------ */
/*  CriticalAlertModal                                                  */
/*                                                                      */
/*  Ported from the HTML's #critical-modal + criticalQueue/showNext     */
/*  Critical flow: whenever a machine trips into "critical" (seeded on   */
/*  load, or minted later by fleetStore.tickFleet), its alert id lands   */
/*  in fleetStore.criticalQueue and pops up here — one at a time, next    */
/*  one surfacing as soon as the current one is dismissed.               */
/*                                                                      */
/*  Mount this ONCE, near the root of whichever layout wraps the fleet   */
/*  pages (OverviewPage is fine) — it's a fixed overlay and doesn't       */
/*  affect surrounding layout.                                           */
/* ------------------------------------------------------------------ */

export default function CriticalAlertModal() {
  const navigate = useNavigate();
  const criticalQueue = useFleetStore((s) => s.criticalQueue);
  const alerts = useFleetStore((s) => s.alerts);
  const dismissCritical = useFleetStore((s) => s.dismissCritical);

  const currentId = criticalQueue[0] || null;
  const current = currentId ? alerts.find((a) => a.id === currentId) : null;

  if (!current) return null;

  const handleView = () => {
    dismissCritical(current.id);
    navigate(`/machines/${current.machineId}`);
  };
  const handleDismiss = () => dismissCritical(current.id);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      >
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-[420px] rounded-xl border border-[#e7d7d7] bg-white p-5 shadow-[0_24px_50px_-22px_rgba(17,17,17,0.28)]"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-[#d7b0ac] bg-[#f9efee] px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.14em] text-[#7a1d1d] uppercase">
              Critical
            </span>
            <button onClick={handleDismiss} className="text-[#5d5a57] hover:text-[#111111]" aria-label="Dismiss alert">
              <X size={15} />
            </button>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#7a1d1d]" />
            <h3 className="text-lg font-semibold text-[#111111]">{current.machine}</h3>
          </div>
          <p className="text-sm text-[#2e2b29] mb-1">{current.message}</p>
          <p className="mb-5 text-xs text-[#5d5a57]">{current.plant} · raised {current.raisedAt}</p>

          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="flex-1 rounded-lg border border-[#d7b0ac] bg-[#f9efee] px-3 py-2 text-xs font-semibold text-[#7a1d1d]"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Eye size={13} /> View machine
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-lg border border-[#dfe4ea] bg-white px-3 py-2 text-xs font-semibold text-[#111111]"
            >
              Dismiss
            </button>
          </div>

          {criticalQueue.length > 1 && (
            <p className="mt-3 text-center text-[0.68rem] text-[#5d5a57]">
              {criticalQueue.length - 1} more critical alert{criticalQueue.length - 1 === 1 ? "" : "s"} queued
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
