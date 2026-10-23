import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Activity, ListChecks } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { StatusPill } from "../../components/ui/StatusPill.jsx";
import MachineTwin from "../../features/digital-twin/components/MachineTwin.jsx";
import { RULGauge } from "../../features/predictions/components/RULGauge.jsx";
import { useFleetStore } from "../../lib/stores/fleetStore.js";
import { genTrend } from "../../lib/mock/machines.js";
import { WORK_ORDERS } from "../../lib/mock/workOrders.js";

export default function MachineDetailPage() {
  const { machineId } = useParams();
  const machine = useFleetStore((s) => s.getMachine(machineId));
  const trend = useMemo(() => (machine ? genTrend(machine) : []), [machine]);
  const history = WORK_ORDERS.filter((wo) => wo.machineId === machineId);

  if (!machine) {
    return (
      <div className="max-w-[900px] mx-auto text-center py-24">
        <p className="text-slate-600">No asset found for “{machineId}”.</p>
        <Link to="/machines" className="text-blue-700 text-sm mt-2 inline-block">← Back to fleet</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link to="/machines" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft size={13} /> Back to fleet
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">{machine.id}</div>
          <h1 className="text-2xl font-semibold text-slate-900">{machine.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{machine.type} · {machine.plant} · {machine.line}</p>
        </div>
        <StatusPill status={machine.status} pulse={machine.status === "critical"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        <div className="xl:col-span-7 flex flex-col gap-6">
          <MachineTwin machine={machine} />

          <GlassCard className="p-6">
            <Eyebrow icon={Activity} tone="cyan">Sensor trend · 24h</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Health score over time</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="t" tick={{ fill: "#5C6875", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#5C6875", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(16,20,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                  <Line type="monotone" dataKey="health" stroke="#D97706" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-6">
          <GlassCard className="p-6">
            <Eyebrow icon={ListChecks} tone="amber">Prediction</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Failure outlook</h3>
            <RULGauge days={machine.rulDays} status={machine.status} />
            {machine.status !== "healthy" && (
              <div className="mt-4 text-xs text-slate-600 leading-relaxed">
                Most likely failure mode: <span className="text-slate-900 font-semibold">{machine.failureMode}</span>.
                Monitored via {machine.sensors.join(", ").toLowerCase()}.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <Eyebrow icon={ListChecks} tone="mint">Service record</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Maintenance history</h3>
            <div className="flex flex-col gap-2.5">
              {history.length === 0 && <div className="text-sm text-slate-500">No work orders logged yet.</div>}
              {history.map((wo) => (
                <div key={wo.id} className="flex items-center justify-between text-sm border-b border-slate-200 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <div className="text-slate-800">{wo.task}</div>
                    <div className="text-[0.7rem] text-slate-500 mt-0.5">{wo.id} · {wo.assignee}</div>
                  </div>
                  <span className="text-xs text-slate-700">{wo.status}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
