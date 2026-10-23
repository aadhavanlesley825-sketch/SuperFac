import React from "react";
import { STATE, STATE_LABEL } from "../theme/tokens.js";

/**
 * status: "healthy" | "monitoring" | "warning" | "critical"
 */
export function StatusPill({ status, label, pulse }) {
  const t = STATE[status] || STATE.monitoring;
  const palette = {
    healthy: { bg: "#f3f3f1", color: "#111111", border: "#d9d6d1" },
    monitoring: { bg: "#f7f7f6", color: "#111111", border: "#d9d6d1" },
    warning: { bg: "#f5f0eb", color: "#3c2a1d", border: "#dac0a5" },
    critical: { bg: "#f9efee", color: "#5f1717", border: "#d7b0ac" },
  };
  const tone = palette[status] || palette.monitoring;
  return (
    <span
      className={`status-pill ${pulse ? "pill-pulse" : ""}`}
      style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}
    >
      {label || STATE_LABEL[status] || status}
    </span>
  );
}

export default StatusPill;
