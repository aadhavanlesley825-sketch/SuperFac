import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { GlassCard } from "../../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../../components/theme/Eyebrow.jsx";
import { StatusPill } from "../../../components/ui/StatusPill.jsx";

export function AlertFeed({ alerts, limit, onAcknowledge, compact }) {
  const list = limit ? alerts.slice(0, limit) : alerts;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-1">
        <Eyebrow icon={AlertTriangle} tone="rose">Predictive alerts</Eyebrow>
        {limit && alerts.length > limit && (
          <Link to="/alerts" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
            View all {alerts.length} →
          </Link>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Active fleet alerts</h3>

      <div className="flex flex-col gap-2">
        {list.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <ShieldAlert size={16} /> No active alerts — fleet nominal.
          </div>
        )}
        {list.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(148,163,184,0.06)" }}
          >
            <StatusPill status={a.severity} pulse={a.severity === "critical" && !a.acknowledged} />
            <div className="flex-1 min-w-0">
              <Link to={`/alerts/${a.id}`} className="text-sm text-slate-700 hover:text-slate-900 truncate block">
                {a.title || a.message}
              </Link>
              {!compact && (
                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                  {a.machine} · {a.plant} · {a.raisedAt}
                </div>
              )}
            </div>
            {onAcknowledge && !a.acknowledged && (
              <button
                onClick={() => onAcknowledge(a.id)}
                className="text-[0.68rem] font-semibold px-2.5 py-1 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 flex-shrink-0"
                style={{ border: "1px solid rgba(180,83,9,0.2)" }}
              >
                Acknowledge
              </button>
            )}
            {a.acknowledged && <span className="text-[0.68rem] text-slate-500 flex-shrink-0">Acked</span>}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default AlertFeed;
