import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Clock, Wrench, ShieldCheck, X, Plus, ClipboardList } from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "../../app/pulseplant-theme.jsx";
import { HealthRing, PriorityBadge, StatusBadge } from "./shared.jsx";
import { useDigitalTwinStore, TECHNICIANS, WO_PRIORITIES } from "../../lib/stores/digitalTwinStore.js";
import { usePermissions } from "./rbac.js";

const SEVERITY_LABEL = { healthy: "Healthy", warning: "Warning", critical: "Critical" };
const SEVERITY_TONE = { healthy: "mint", warning: "amber", critical: "rose" };

function fmtHours(h) {
  if (h == null) return "—";
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d ${h % 24}h`;
}

function ReadingRow({ label, value, unit, band }) {
  const outOfBand = band ? value < band[0] || value > band[1] : false;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0">
      <span className="text-xs text-slate-600 capitalize">{label}</span>
      <span className="text-xs font-semibold" style={{ color: outOfBand ? TONE.rose.text : "#0f172a" }}>
        {value.toFixed(1)} <span className="text-slate-500 font-normal">{unit}</span>
      </span>
    </div>
  );
}

function SparePartsInput({ parts, setParts }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    setParts([...parts, draft.trim()]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add spare part…"
          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
        />
        <button onClick={add} className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200">
          <Plus size={14} />
        </button>
      </div>
      {parts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {parts.map((p, i) => (
            <span key={i} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
              {p}
              <X size={10} className="cursor-pointer" onClick={() => setParts(parts.filter((_, j) => j !== i))} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkOrderForm({ componentId, onCreated }) {
  const { canAssignWorkOrders } = usePermissions();
  const createWorkOrder = useDigitalTwinStore((s) => s.createWorkOrder);
  const createPulseAICriticalWorkOrder = useDigitalTwinStore((s) => s.createPulseAICriticalWorkOrder);
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parts, setParts] = useState([]);
  const [notes, setNotes] = useState("");

  const submit = () => {
    const order = createWorkOrder({
      componentId,
      priority,
      assignedTo: canAssignWorkOrders && assignedTo ? assignedTo : null,
      dueDate: canAssignWorkOrders && dueDate ? dueDate : null,
      spareParts: parts,
      notes,
    });
    onCreated?.(order);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[0.65rem] text-slate-500 block mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            {WO_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] text-slate-500 block mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            disabled={!canAssignWorkOrders}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none disabled:opacity-40"
          />
        </div>
      </div>

      <div>
        <label className="text-[0.65rem] text-slate-500 block mb-1">
          Assign to {!canAssignWorkOrders && <span className="text-slate-500">(Admin / Plant Manager only)</span>}
        </label>
        <select
          value={assignedTo}
          disabled={!canAssignWorkOrders}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none disabled:opacity-40"
        >
          <option value="">Unassigned</option>
          {TECHNICIANS.map((t) => (
            <option key={t.id} value={t.id}>{t.name} · {t.role}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[0.65rem] text-slate-500 block mb-1">Required spare parts</label>
        <SparePartsInput parts={parts} setParts={setParts} />
      </div>

      <div>
        <label className="text-[0.65rem] text-slate-500 block mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Context for the technician…"
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none resize-none"
        />
      </div>

      <button
        onClick={submit}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
        style={{ background: TONE.cyan.soft, color: TONE.cyan.text, border: `1px solid ${TONE.cyan.ring}` }}
      >
        <ClipboardList size={13} /> Generate work order
      </button>

      {useDigitalTwinStore.getState().readings[componentId]?.severity === "critical" && (
        <button
          onClick={() => {
            const order = createPulseAICriticalWorkOrder({
              componentId,
              priority: "Critical",
              notes: `PulseAI flagged this component as critical and initiated a maintenance action for immediate review.`,
            });
            onCreated?.(order);
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "#fdf2f2", color: "#7a1d1d", border: "1px solid #d7b0ac" }}
        >
          <ShieldCheck size={13} /> PulseAI critical work order
        </button>
      )}
    </div>
  );
}

export default function DiagnosticsPanel({ componentId, onOpenWorkOrder }) {
  const component = useDigitalTwinStore((s) => s.getComponent(componentId));
  const reading = useDigitalTwinStore((s) => s.readings[componentId]);
  const activeWO = useDigitalTwinStore((s) => s.getActiveWorkOrder(componentId));
  const clearSelection = useDigitalTwinStore((s) => s.clearSelection);
  const [justCreated, setJustCreated] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreated = (order) => {
    setJustCreated(order);
    setIsCreateModalOpen(false);
  };

  const diagnosis = useMemo(() => {
    if (!component || !reading) return null;
    return useDigitalTwinStore.getState().getDiagnosis(componentId);
  }, [component, reading, componentId]);

  if (!component || !reading) {
    return (
      <GlassCard className="p-6 h-full flex items-center justify-center text-center" hover={false}>
        <div>
          <Cpu size={22} className="mx-auto mb-2 text-slate-500" />
          <p className="text-sm text-slate-600">Select a component on the twin to open AI diagnostics.</p>
        </div>
      </GlassCard>
    );
  }

  const tone = SEVERITY_TONE[reading.severity];

  return (
    <GlassCard className="p-6 h-full overflow-y-auto" hover={false} style={{ maxHeight: 620 }}>
      <div className="flex items-start justify-between mb-4">
        <Eyebrow icon={Cpu} tone={tone}>AI diagnostics</Eyebrow>
        <button onClick={clearSelection} className="text-slate-500 hover:text-slate-700">
          <X size={15} />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sky-700">
        <span>SIMULATED DATA</span>
        <span className="text-sky-600">{new Date(reading.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="flex items-center gap-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <HealthRing health={reading.health} severity={reading.severity} />
        <div className="min-w-0 flex-1">
          <h3 className="panel-title leading-tight text-slate-900 m-0 truncate">{component.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full" style={{ color: TONE[tone].text, background: TONE[tone].soft }}>
              {SEVERITY_LABEL[reading.severity]}
            </span>
            <span className="text-[0.65rem] text-slate-500">{component.category}</span>
            <span className="text-[0.65rem] text-slate-500">{component.zone}</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[0.65rem] uppercase tracking-wide text-slate-500 mb-1.5">Live sensor readings</div>
        {component.sensors.map((key) => (
          <ReadingRow key={key} label={key} value={reading.values[key]} unit={component.units[key]} band={component.baseline[key]} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[0.62rem] text-slate-500 mb-0.5">Diagnosis confidence</div>
          <div className="text-sm font-bold text-slate-900">{diagnosis.confidence}%</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[0.62rem] text-slate-500 mb-0.5">Risk level</div>
          <div className="text-sm font-bold text-slate-900">{diagnosis.riskLevel}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[0.62rem] text-slate-500 mb-0.5 flex items-center gap-1"><Clock size={10} /> Est. time to failure</div>
          <div className="text-sm font-bold text-slate-900">{fmtHours(diagnosis.etaToFailureHours)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[0.62rem] text-slate-500 mb-0.5 flex items-center gap-1"><Wrench size={10} /> Est. repair time</div>
          <div className="text-sm font-bold text-slate-900">{diagnosis.repairTimeHours}h</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[0.62rem] text-slate-500 mb-0.5 flex items-center gap-1"><ShieldCheck size={10} /> Installed</div>
          <div className="text-sm font-bold text-slate-900">{component.installedYearsAgo}y ago</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[0.65rem] uppercase tracking-wide text-slate-500 mb-1">Probable root cause</div>
        <p className="text-xs text-slate-700 leading-relaxed">{diagnosis.rootCause}</p>
      </div>

      <div className="mt-3">
        <div className="text-[0.65rem] uppercase tracking-wide text-slate-500 mb-1">Recommended action</div>
        <p className="text-xs text-slate-700 leading-relaxed">{diagnosis.recommendedAction}</p>
      </div>

      <div className="mt-3">
        <div className="text-[0.65rem] uppercase tracking-wide text-slate-500 mb-1">Maintenance history</div>
        <div className="space-y-1.5">
          {diagnosis.maintenanceHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-700">{h.action}</span>
              <span className="text-slate-500 text-[0.65rem]">{h.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200">
        <AnimatePresence mode="wait">
          {activeWO ? (
            <motion.div key="active" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-900">{activeWO.id}</span>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={activeWO.priority} />
                  <StatusBadge status={activeWO.status} />
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Assigned to {TECHNICIANS.find((t) => t.id === activeWO.assignedTo)?.name || "Unassigned"}
              </p>
              <button
                onClick={() => onOpenWorkOrder?.(activeWO.id)}
                className="w-full py-2 rounded-lg text-xs font-semibold"
                style={{ background: TONE.cyan.soft, color: TONE.cyan.text, border: `1px solid ${TONE.cyan.ring}` }}
              >
                Open in Work Orders
              </button>
            </motion.div>
          ) : justCreated ? (
            <motion.div key="created" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="text-xs text-slate-600 mb-2">
                Work order <span className="text-slate-900 font-semibold">{justCreated.id}</span> created.
              </p>
              <button
                onClick={() => onOpenWorkOrder?.(justCreated.id)}
                className="w-full py-2 rounded-lg text-xs font-semibold"
                style={{ background: TONE.mint.soft, color: TONE.mint.text, border: `1px solid ${TONE.mint.ring}` }}
              >
                View work order
              </button>
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-[0.65rem] uppercase tracking-wide text-slate-500 mb-2">Raise a work order</div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-3 rounded-lg text-xs font-semibold"
                style={{ background: TONE.cyan.soft, color: TONE.cyan.text, border: `1px solid ${TONE.cyan.ring}` }}
              >
                Create work order
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isCreateModalOpen ? (
          <motion.div
            key="wo-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-6"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-xl rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(148,163,184,0.28)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-1">New work order</p>
                  <h2 className="text-lg font-semibold text-slate-900">Raise work order for {component.name}</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                <WorkOrderForm componentId={componentId} onCreated={handleCreated} />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GlassCard>
  );
}
