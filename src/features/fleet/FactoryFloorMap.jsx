import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";

/* ------------------------------------------------------------------ */
/*  FactoryFloorMap                                                     */
/*                                                                      */
/*  Ported from the reference HTML's "Factory Blueprint" panel: group    */
/*  assets into zones and show a colored, clickable dot per machine.     */
/*  Re-scoped here from `line` (the HTML's grouping) to `plant`, since    */
/*  that's the dimension the rest of this fleet (Overview/FleetExplorer) */
/*  already organizes by. Clicking a dot navigates to the same route      */
/*  FleetExplorerPage's row click uses, so behavior stays consistent      */
/*  across both entry points.                                            */
/* ------------------------------------------------------------------ */

const STATUS_COLOR = {
  healthy: "#5FD9AE",
  monitoring: "#3FD0EA",
  warning: "#F0A93B",
  critical: "#F1717A",
};

const COLS = 2;
const ZONE_W = 320;
const ZONE_H = 150;
const GAP = 16;
const PER_ROW = 6;

function FloorZone({ plant, machines, zx, zy, onSelect }) {
  return (
    <g>
      <rect x={zx} y={zy} width={ZONE_W} height={ZONE_H} rx={10} fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.2)" strokeWidth={1.5} />
      <text x={zx + 14} y={zy + 22} fill="#475569" fontSize={10} fontFamily="monospace" letterSpacing="0.05em">
        {plant.toUpperCase()}
      </text>
      {machines.map((m, i) => {
        const col = i % PER_ROW;
        const row = Math.floor(i / PER_ROW);
        const mx = zx + 32 + col * 46;
        const my = zy + 56 + row * 40;
        if (my > zy + ZONE_H - 14) return null;
        const color = STATUS_COLOR[m.status];
        const isCritical = m.status === "critical";
        return (
          <g key={m.id} onClick={() => onSelect(m.id)} style={{ cursor: "pointer" }}>
            <circle cx={mx} cy={my} r={isCritical ? 7 : 5.5} fill={color} />
            {isCritical && (
              <circle cx={mx} cy={my} r={9} fill="none" stroke={color} strokeWidth={1} opacity={0.6}>
                <animate attributeName="r" values="6;13;6" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <title>{m.name} — {m.status}, {m.healthScore}%</title>
          </g>
        );
      })}
    </g>
  );
}

export default function FactoryFloorMap({ machines }) {
  const navigate = useNavigate();

  const zones = useMemo(() => {
    const byPlant = new Map();
    machines.forEach((m) => {
      if (!byPlant.has(m.plant)) byPlant.set(m.plant, []);
      byPlant.get(m.plant).push(m);
    });
    return [...byPlant.entries()].map(([plant, list]) => ({ plant, machines: list }));
  }, [machines]);

  const rows = Math.ceil(zones.length / COLS);
  const svgW = COLS * ZONE_W + (COLS + 1) * GAP;
  const svgH = rows * ZONE_H + (rows + 1) * GAP;

  const handleSelect = (id) => navigate(`/machines/${id}`);

  return (
    <GlassCard className="p-4 md:p-5 w-full max-h-[360px]" hover={false}>
      <div className="flex items-center justify-between mb-1">
        <Eyebrow icon={MapIcon} tone="cyan">Plant floor</Eyebrow>
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">Factory Floor Map</h3>
      <p className="text-xs text-slate-600 mb-2.5">Click any asset to open its detail page.</p>

      <div className="w-full" style={{ maxWidth: 620, margin: "0 auto" }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: 220,
            minWidth: 0,
            aspectRatio: `${svgW} / ${svgH}`,
          }}
        >
          {zones.map((z, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return (
              <FloorZone
                key={z.plant}
                plant={z.plant}
                machines={z.machines}
                zx={GAP + col * (ZONE_W + GAP)}
                zy={GAP + row * (ZONE_H + GAP)}
                onSelect={handleSelect}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[0.68rem] text-slate-600">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 capitalize">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {status}
            </div>
          ))}
        </div>
        <span className="text-slate-500 whitespace-nowrap">{machines.length} machines</span>
      </div>
    </GlassCard>
  );
}
