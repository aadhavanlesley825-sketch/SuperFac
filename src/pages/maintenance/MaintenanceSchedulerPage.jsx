import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Filter } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { WORK_ORDERS } from "../../lib/mock/workOrders.js";

const PRIORITY_COLOR = { Urgent: "#F1717A", High: "#F0A93B", Routine: "#5FD9AE" };
const STATUSES = ["all", "Scheduled", "In progress", "Completed"];

export default function MaintenanceSchedulerPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(
    () => (statusFilter === "all" ? WORK_ORDERS : WORK_ORDERS.filter((w) => w.status === statusFilter)),
    [statusFilter]
  );

  const columns = [
    { key: "id", label: "Work order", sortable: true },
    { key: "machine", label: "Machine", sortable: true },
    { key: "task", label: "Task" },
    { key: "priority", label: "Priority", sortable: true, render: (r) => (
      <span className="text-xs font-semibold" style={{ color: PRIORITY_COLOR[r.priority] }}>{r.priority}</span>
    ) },
    { key: "dueIn", label: "Due" },
    { key: "assignee", label: "Assignee" },
    { key: "status", label: "Status", sortable: true },
  ];

  const counts = STATUSES.slice(1).map((s) => ({ label: s, n: WORK_ORDERS.filter((w) => w.status === s).length }));

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">Maintenance</div>
        <h1 className="text-2xl font-semibold text-slate-900">Work order queue</h1>
        <p className="text-sm text-slate-600 mt-1">Generated from predictive alerts and scheduled PM cycles.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
        {counts.map((c) => (
          <GlassCard key={c.label} hover={false} className="p-4 text-center">
            <div className="text-xl font-semibold text-slate-900">{c.n}</div>
            <div className="text-[0.68rem] text-slate-500 mt-0.5">{c.label}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center justify-between mb-4">
          <Eyebrow icon={Wrench} tone="amber">Queue</Eyebrow>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-slate-500 mr-1" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors border ${
                  statusFilter === s
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} rows={rows} onRowClick={(r) => navigate(`/maintenance/${r.id}`)} />
      </GlassCard>
    </div>
  );
}
