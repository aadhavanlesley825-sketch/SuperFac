import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ClipboardList, X, Send, Box } from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "../../app/pulseplant-theme.jsx";
import {
  PriorityBadge,
  StatusBadge,
  StatusStepper,
  SlaCountdown,
} from "./shared.jsx";
import {
  useDigitalTwinStore,
  WO_STATUSES,
  WO_PRIORITIES,
  TECHNICIANS,
  ROLES,
} from "../../lib/stores/digitalTwinStore.js";
import { usePermissions, useRole } from "./rbac.js";

function technicianName(id) {
  return TECHNICIANS.find((t) => t.id === id)?.name || "Unassigned";
}

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/* -------------------------------- Role switcher (demo) -------------------------------- */
// Stand-in for the real auth session while this integrates with AuthContext —
// see src/lib/rbac.js. Lets you demo the Admin/PM vs Engineer/Technician
// permission split without a second login.
function RoleSwitcher() {
  const role = useRole();
  const setRole = useDigitalTwinStore((s) => s.setRole);
  return (
    <select
      value={role}
      onChange={(e) => setRole(e.target.value)}
      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700"
      title="Demo role switcher — wire to real auth in src/lib/rbac.js"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>Viewing as: {r}</option>
      ))}
    </select>
  );
}

/* -------------------------------- Filters -------------------------------- */
function useFilteredOrders(workOrders, { query, statusFilter, priorityFilter, techFilter, sourceFilter }) {
  return useMemo(() => {
    return workOrders
      .filter((w) => !query || `${w.id} ${w.componentName} ${w.title}`.toLowerCase().includes(query.toLowerCase()))
      .filter((w) => statusFilter === "All" || w.status === statusFilter)
      .filter((w) => priorityFilter === "All" || w.priority === priorityFilter)
      .filter((w) => techFilter === "All" || w.assignedTo === techFilter)
      .filter((w) => sourceFilter === "All" || w.source === sourceFilter)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [workOrders, query, statusFilter, priorityFilter, techFilter, sourceFilter]);
}

/* -------------------------------- Row -------------------------------- */
function WorkOrderRow({ order, onOpen }) {
  return (
    <button
      onClick={() => onOpen(order.id)}
      className="w-full grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl hover:bg-slate-50 text-left"
    >
      <div className="col-span-3 min-w-0">
        <div className="text-xs font-semibold text-slate-900 truncate">{order.id}</div>
        <div className="mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.56rem] font-semibold tracking-wide uppercase" style={{
          color: order.source === "PulseAI" ? "#7a1d1d" : "#334155",
          borderColor: order.source === "PulseAI" ? "#d7b0ac" : "#dfe4ea",
          background: order.source === "PulseAI" ? "#f9efee" : "#f8fafc",
        }}>
          {order.source === "PulseAI" ? "PulseAI" : "Staff"}
        </div>
        <div className="text-[0.68rem] text-slate-500 truncate mt-1">{order.componentName}</div>
      </div>
      <div className="col-span-2 min-w-0">
        <span className="text-xs text-slate-700 truncate block">{order.title}</span>
      </div>
      <div className="col-span-2 min-w-0">
        <span className="text-xs text-slate-700 truncate block">{order.assignee || (order.source === "PulseAI" ? "PulseAI" : "Unassigned")}</span>
      </div>
      <div className="col-span-2"><PriorityBadge priority={order.priority} /></div>
      <div className="col-span-2"><StatusBadge status={order.status} /></div>
      <div className="col-span-1 flex justify-end">
        <SlaCountdown createdAt={order.createdAt} slaHours={order.slaHours} resolved={order.status === "Resolved" || order.status === "Closed"} />
      </div>
    </button>
  );
}

/* -------------------------------- Detail drawer -------------------------------- */
function WorkOrderDrawer({ orderId, onClose }) {
  const order = useDigitalTwinStore((s) => s.workOrders.find((w) => w.id === orderId));
  const updateStatus = useDigitalTwinStore((s) => s.updateWorkOrderStatus);
  const assignWorkOrder = useDigitalTwinStore((s) => s.assignWorkOrder);
  const addComment = useDigitalTwinStore((s) => s.addComment);
  const { canAssignWorkOrders, canUpdateProgress, canCloseWorkOrder } = usePermissions();
  const [comment, setComment] = useState("");
  const [assignee, setAssignee] = useState(order?.assignedTo || "");

  useEffect(() => setAssignee(order?.assignedTo || ""), [order?.assignedTo]);

  if (!order) return null;

  const idx = WO_STATUSES.indexOf(order.status);
  const nextStatus = WO_STATUSES[idx + 1];
  const canAdvance = nextStatus && (nextStatus === "Closed" ? canCloseWorkOrder : canUpdateProgress);
  const assignmentLabel = order.source === "PulseAI" ? "PulseAI critical" : "Staff assigned";
  const assignedBy = order.source === "PulseAI" ? "PulseAI" : order.assignedTo ? technicianName(order.assignedTo) : "Unassigned";

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-40 p-4"
    >
      <GlassCard className="p-6 h-full overflow-y-auto" hover={false}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-slate-500">{order.id}</div>
            <h3 className="panel-title leading-tight text-slate-900">{order.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <PriorityBadge priority={order.priority} />
          <StatusBadge status={order.status} />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-slate-600">
            {assignmentLabel}
          </span>
          <SlaCountdown createdAt={order.createdAt} slaHours={order.slaHours} resolved={order.status === "Resolved" || order.status === "Closed"} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div>
            <div className="text-[0.62rem] uppercase tracking-wide text-slate-500 mb-1">Assigned by</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700">{assignedBy}</div>
          </div>
          <div>
            <div className="text-[0.62rem] uppercase tracking-wide text-slate-500 mb-1">Source</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700">{order.source}</div>
          </div>
        </div>

        <div className="mb-5 overflow-x-auto">
          <StatusStepper current={order.status} />
        </div>

        <div className="rounded-xl bg-slate-50 p-3 mb-4 text-xs text-slate-700 leading-relaxed">
          {order.diagnosisSnapshot?.rootCause}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[0.62rem] text-slate-500 block mb-1">Assigned to</label>
            <select
              value={assignee}
              disabled={!canAssignWorkOrders}
              onChange={(e) => {
                setAssignee(e.target.value);
                assignWorkOrder(order.id, { assignedTo: e.target.value || null });
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none disabled:opacity-40"
            >
              <option value="">Unassigned</option>
              {TECHNICIANS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.62rem] text-slate-500 block mb-1">Due date</label>
            <input
              type="date"
              value={order.dueDate || ""}
              disabled={!canAssignWorkOrders}
              onChange={(e) => assignWorkOrder(order.id, { dueDate: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none disabled:opacity-40"
            />
          </div>
        </div>

        {order.spareParts?.length > 0 && (
          <div className="mb-4">
            <label className="text-[0.62rem] text-slate-500 block mb-1.5">Spare parts</label>
            <div className="flex flex-wrap gap-1.5">
              {order.spareParts.map((p, i) => (
                <span key={i} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Box size={10} /> {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {canAdvance && (
          <button
            onClick={() => updateStatus(order.id, nextStatus)}
            className="w-full mb-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: TONE.mint.soft, color: TONE.mint.text, border: `1px solid ${TONE.mint.ring}` }}
          >
            Advance to “{nextStatus}”
          </button>
        )}

        <div className="mb-2">
          <label className="text-[0.62rem] text-slate-500 block mb-1.5">Progress timeline</label>
          <div className="space-y-1.5">
            {order.timeline.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{t.status} <span className="text-slate-500">· {t.by}</span></span>
                <span className="text-slate-500 text-[0.62rem]">{timeAgo(t.ts)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="text-[0.62rem] text-slate-500 block mb-1.5">Comments</label>
          <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
            {order.comments.map((c) => (
              <div key={c.id} className="text-xs bg-slate-50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-slate-700">{c.author}</span>
                  <span className="text-slate-500 text-[0.6rem]">{timeAgo(c.ts)}</span>
                </div>
                <p className="text-slate-700">{c.text}</p>
              </div>
            ))}
            {order.comments.length === 0 && <p className="text-slate-500 text-xs">No comments yet.</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && comment.trim()) {
                  addComment(order.id, comment.trim());
                  setComment("");
                }
              }}
              placeholder="Add a comment…"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
            />
            <button
              onClick={() => {
                if (!comment.trim()) return;
                addComment(order.id, comment.trim());
                setComment("");
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* -------------------------------- Page -------------------------------- */
export default function WorkOrdersPage() {
  const workOrders = useDigitalTwinStore((s) => s.workOrders);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [techFilter, setTechFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [openId, setOpenId] = useState(params.get("open") || null);

  const filtered = useFilteredOrders(workOrders, { query, statusFilter, priorityFilter, techFilter, sourceFilter });
  const completed = workOrders.filter((w) => w.status === "Resolved" || w.status === "Closed");
  const staffCount = workOrders.filter((w) => w.source === "Staff").length;
  const pulseAiCount = workOrders.filter((w) => w.source === "PulseAI").length;

  const openDrawer = (id) => {
    setOpenId(id);
    setParams(id ? { open: id } : {});
  };
  const closeDrawer = () => {
    setOpenId(null);
    setParams({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Work Orders</h1>
          <p className="text-sm text-slate-600 mt-1">
            {workOrders.length} total · {workOrders.length - completed.length} open · {completed.length} completed
          </p>
        </div>
        <RoleSwitcher />
      </div>

      <GlassCard className="p-4" hover={false}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {[
            { key: "All", label: "All work orders" },
            { key: "Staff", label: "Staff assigned" },
            { key: "PulseAI", label: "PulseAI critical" },
          ].map((tab) => {
            const count = tab.key === "All" ? workOrders.length : tab.key === "Staff" ? staffCount : pulseAiCount;
            const active = sourceFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSourceFilter(tab.key)}
                className="rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition"
                style={{
                  borderColor: active ? "#111827" : "#dfe4ea",
                  background: active ? "#111827" : "#fff",
                  color: active ? "#fff" : "#334155",
                }}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-[180px]">
            <Search size={13} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search work orders, components…"
              className="bg-transparent text-xs outline-none flex-1 text-slate-700"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700">
            <option>All</option>
            {WO_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700">
            <option>All</option>
            {WO_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700">
            <option value="All">All technicians</option>
            {TECHNICIANS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="p-2" hover={false}>
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[0.62rem] uppercase tracking-wide text-slate-500">
          <div className="col-span-3">Ticket</div>
          <div className="col-span-2">Title</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">SLA</div>
        </div>
        <div className="space-y-0.5">
          {filtered.map((o) => (
            <WorkOrderRow key={o.id} order={o} onOpen={openDrawer} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <ClipboardList size={22} className="mb-2" />
              <p className="text-xs">No work orders match these filters.</p>
            </div>
          )}
        </div>
      </GlassCard>

      <AnimatePresence>
        {openId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-30"
              onClick={closeDrawer}
            />
            <WorkOrderDrawer orderId={openId} onClose={closeDrawer} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
