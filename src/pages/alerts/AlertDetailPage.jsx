import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { StatusPill } from "../../components/ui/StatusPill.jsx";
import MachineTwin from "../../features/digital-twin/components/MachineTwin.jsx";
import { DetectionTimeline } from "../../features/predictions/components/DetectionTimeline.jsx";
import { useFleetStore } from "../../lib/stores/fleetStore.js";
import { DETECTION_TIMELINE } from "../../lib/mock/alerts.js";

export default function AlertDetailPage() {
  const { alertId } = useParams();
  const alerts = useFleetStore((s) => s.alerts);
  const acknowledgeAlert = useFleetStore((s) => s.acknowledgeAlert);
  const machines = useFleetStore((s) => s.machines);

  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) {
    return (
      <div className="max-w-[900px] mx-auto text-center py-24">
        <p className="text-slate-600">No alert found for “{alertId}”.</p>
        <Link to="/alerts" className="text-amber-700 text-sm mt-2 inline-block">← Back to alerts</Link>
      </div>
    );
  }
  const machine = machines.find((m) => m.id === alert.machineId);

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link to="/alerts" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft size={13} /> Back to alerts
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">{alert.id}</div>
          <h1 className="text-2xl font-semibold text-slate-900">{alert.title || alert.message}</h1>
          <p className="text-sm text-slate-600 mt-1">{alert.machine} · {alert.plant} · raised {alert.raisedAt}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={alert.severity} pulse={alert.severity === "critical" && !alert.acknowledged} />
          {!alert.acknowledged && (
            <button
              onClick={() => acknowledgeAlert(alert.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50"
              style={{ border: "1px solid rgba(180,83,9,0.2)" }}
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7">
          {machine && <MachineTwin machine={machine} />}
        </div>
        <div className="xl:col-span-5">
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500 mb-2">Assignment details</div>
              <div className="space-y-3 text-sm text-slate-700">
                <div><span className="text-slate-500">Source:</span> {alert.sourceLabel || alert.source || "Staff Assigned"}</div>
                <div><span className="text-slate-500">Assignee:</span> {alert.source === "PulseAI" ? "PulseAI" : alert.responsibleTechnician || "Unassigned"}</div>
                {alert.priority && <div><span className="text-slate-500">Priority:</span> {alert.priority}</div>}
                {alert.dueDate && <div><span className="text-slate-500">Due date:</span> {alert.dueDate}</div>}
                {alert.workOrderId && <div><span className="text-slate-500">Work order:</span> {alert.workOrderId}</div>}
                {alert.originatingAlert && <div><span className="text-slate-500">Origin:</span> {alert.originatingAlert}</div>}
              </div>
              {alert.actionUrl && (
                <Link
                  to={alert.actionUrl}
                  className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {alert.actionLabel || "View Work Order"}
                </Link>
              )}
            </GlassCard>
            <DetectionTimeline events={DETECTION_TIMELINE} />
          </div>
        </div>
      </div>
    </div>
  );
}
