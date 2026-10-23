import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { TONE } from "../../app/pulseplant-theme.jsx";
import { WO_STATUSES, SEVERITY_COLOR } from "../../lib/stores/digitalTwinStore.js";

/* ------------------------------------------------------------------ */
/*  Small, dependency-free UI pieces shared by DiagnosticsPanel and     */
/*  WorkOrdersPage — kept out of both so the status pipeline, badges,   */
/*  and SLA math only exist in one place.                               */
/* ------------------------------------------------------------------ */

export const PRIORITY_TONE = {
  Low: "mint",
  Medium: "cyan",
  High: "amber",
  Critical: "rose",
};

export function PriorityBadge({ priority }) {
  const t = TONE[PRIORITY_TONE[priority] || "cyan"];
  return (
    <span
      className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: t.text, background: t.soft, border: `1px solid ${t.ring}` }}
    >
      {priority}
    </span>
  );
}

const STATUS_TONE = {
  Open: "rose",
  Assigned: "amber",
  Accepted: "amber",
  "In Progress": "amber",
  "Waiting for Parts": "amber",
  Testing: "cyan",
  Resolved: "mint",
  Closed: "mint",
};

export function StatusBadge({ status }) {
  const t = TONE[STATUS_TONE[status] || "cyan"];
  return (
    <span
      className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: t.text, background: t.soft, border: `1px solid ${t.ring}` }}
    >
      {status}
    </span>
  );
}

export function HealthRing({ health, severity, size = 54 }) {
  const color = SEVERITY_COLOR[severity] || SEVERITY_COLOR.healthy;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - health / 100);
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={4} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 5px ${color}88)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {health}%
      </div>
    </div>
  );
}

// Full Open -> Closed pipeline. `current` highlights everything up to and
// including the active status; statuses can be skipped forward (e.g.
// Assigned -> Resolved directly) without breaking the stepper's rendering.
export function StatusStepper({ current }) {
  const idx = WO_STATUSES.indexOf(current);
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {WO_STATUSES.map((status, i) => {
        const done = i < idx;
        const active = i === idx;
        const color = active ? TONE.amber.text : done ? TONE.mint.text : "#3A4250";
        return (
          <React.Fragment key={status}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? TONE.mint.soft : active ? TONE.amber.soft : "rgba(255,255,255,0.04)",
                  border: `1px solid ${color}`,
                }}
              >
                {done ? <Check size={11} style={{ color: TONE.mint.text }} /> : (
                  <span className="text-[0.6rem] font-bold" style={{ color }}>{i + 1}</span>
                )}
              </div>
              <span className="text-[0.68rem] whitespace-nowrap" style={{ color: active ? "#fff" : done ? "#B7C0CC" : "#6B7684" }}>
                {status}
              </span>
            </div>
            {i < WO_STATUSES.length - 1 && (
              <div className="w-5 h-px mx-1" style={{ background: done ? TONE.mint.ring : "#2A3038" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Live-updating "time remaining / overdue" chip against a ticket's SLA clock.
export function SlaCountdown({ createdAt, slaHours, resolved }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (resolved) return;
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [resolved]);

  const deadline = createdAt + slaHours * 3600 * 1000;
  const remainingMs = deadline - Date.now();
  const overdue = remainingMs < 0 && !resolved;
  const abs = Math.abs(remainingMs);
  const hrs = Math.floor(abs / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const label = resolved ? "Met SLA" : `${overdue ? "Overdue " : ""}${hrs}h ${mins}m${overdue ? "" : " left"}`;
  const tone = resolved ? TONE.mint : overdue ? TONE.rose : hrs < 2 ? TONE.amber : TONE.cyan;

  return (
    <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full" style={{ color: tone.text, background: tone.soft }}>
      {label}
    </span>
  );
}
