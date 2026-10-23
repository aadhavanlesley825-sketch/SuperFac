import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Filter } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { StatusPill } from "../../components/ui/StatusPill.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { useFleetStore } from "../../lib/stores/fleetStore.js";

const FILTERS = ["all", "critical", "warning", "monitoring", "healthy"];

export default function FleetExplorerPage() {
  const machines = useFleetStore((s) => s.machines);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const rows = useMemo(
    () => (filter === "all" ? machines : machines.filter((m) => m.status === filter)),
    [machines, filter]
  );

  const columns = [
    { key: "id", label: "Asset ID", sortable: true },
    { key: "name", label: "Machine", sortable: true },
    { key: "plant", label: "Plant", sortable: true },
    { key: "healthScore", label: "Health", sortable: true, render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-[#eceae7] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${r.healthScore}%`, background: "#111111" }} />
        </div>
        <span className="mono text-xs text-[#111111]">{r.healthScore}%</span>
      </div>
    ) },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} pulse={r.status === "critical"} /> },
    { key: "rulDays", label: "RUL", sortable: true, render: (r) => <span className="mono text-[#111111]">{r.rulDays}d</span> },
    { key: "lastService", label: "Last service" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-[0.7rem] font-semibold tracking-[0.14em] text-[#5a5754] uppercase mb-2">Fleet</div>
        <h1 className="text-[2.3rem] md:text-[3rem] font-black tracking-[-0.08em] uppercase text-[#111111]">Machines</h1>
        <p className="text-sm text-[#5b5754] mt-2">{machines.length} monitored assets at the Nike Chennai Manufacturing Facility.</p>
      </div>

      <GlassCard className="p-5 md:p-6" hover={false}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <Eyebrow icon={Factory} tone="cyan">All assets</Eyebrow>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-[#5b5754] mr-1" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors border ${
                  filter === f ? "bg-[#111111] text-white border-[#111111]" : "text-[#4d4a47] hover:text-[#111111] hover:bg-[#f3f2f0] border-[#e4e1dd]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} rows={rows} onRowClick={(r) => navigate(`/machines/${r.id}`)} />
      </GlassCard>
    </div>
  );
}
