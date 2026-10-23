import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Wrench, User, Clock3 } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { WORK_ORDERS } from "../../lib/mock/workOrders.js";
import { useFleetStore } from "../../lib/stores/fleetStore.js";
import MachineTwin from "../../features/digital-twin/components/MachineTwin.jsx";

export default function WorkOrderDetailPage() {
  const { workOrderId } = useParams();
  const wo = WORK_ORDERS.find((w) => w.id === workOrderId);
  const machine = useFleetStore((s) => s.getMachine(wo?.machineId));

  if (!wo) {
    return (
      <div className="max-w-[900px] mx-auto text-center py-24">
        <p className="text-slate-600">No work order found for “{workOrderId}”.</p>
        <Link to="/maintenance" className="text-amber-700 text-sm mt-2 inline-block">← Back to queue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link to="/maintenance" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft size={13} /> Back to queue
      </Link>

      <div className="mb-6">
        <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">{wo.id}</div>
        <h1 className="text-2xl font-semibold text-slate-900">{wo.task}</h1>
        <p className="text-sm text-slate-600 mt-1">{wo.machine} · {wo.plant}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7">
          {machine && <MachineTwin machine={machine} />}
        </div>
        <div className="xl:col-span-5">
          <GlassCard className="p-6">
            <Eyebrow icon={Wrench} tone="amber">Work order</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Details</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700"><User size={14} /> Queue assignee: {wo.assignee}</div>
              <div className="flex items-center gap-2 text-slate-700"><User size={14} /> Responsible technician: {wo.responsibleTechnician || wo.assignee}</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold text-slate-900 mb-1">Source</div>
                <div>{wo.sourceLabel || (wo.source === "PulseAI" ? "PulseAI Auto-Assigned" : "Staff Assigned")}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold text-slate-900 mb-1">Origin</div>
                <div>{wo.originatingAlert || "Manual work order request"}</div>
              </div>
              <div className="flex items-center gap-2 text-slate-700"><Clock3 size={14} /> Due {wo.dueIn}</div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1">
                <span className="text-slate-500 text-xs">Priority</span>
                <span className="text-slate-900 font-semibold text-sm">{wo.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Status</span>
                <span className="text-slate-900 font-semibold text-sm">{wo.status}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
