import React from "react";
import { STATE } from "../../../components/theme/tokens.js";

/**
 * Horizontal remaining-useful-life bar: 0 = failure imminent, 180+ = long horizon.
 */
export function RULGauge({ days, status }) {
  const tone = STATE[status] || STATE.monitoring;
  const pct = Math.min(100, (days / 180) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-slate-600">Remaining useful life</span>
        <span className="text-sm font-semibold mono" style={{ color: tone.text }}>{days} days</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: tone.text, boxShadow: `0 0 10px ${tone.ring}` }}
        />
      </div>
      <div className="flex justify-between text-[0.65rem] text-slate-500 mt-1">
        <span>0d</span>
        <span>90d</span>
        <span>180d+</span>
      </div>
    </div>
  );
}

export default RULGauge;
