import React from "react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared design tokens + primitives.                                 */
/*  Pulled out of PulsePlantDashboard.jsx so the new Conveyor3D panel   */
/*  can reuse the exact same glass-card chrome without duplicating it   */
/*  or creating a circular import between the two files.                */
/* ------------------------------------------------------------------ */

export const TONE = {
  amber: { text: "#b45309", soft: "rgba(245,158,11,0.12)", ring: "rgba(245,158,11,0.28)" },
  cyan: { text: "#a45d1d", soft: "rgba(217,119,6,0.10)", ring: "rgba(217,119,6,0.24)" },
  rose: { text: "#b91c1c", soft: "rgba(239,68,68,0.10)", ring: "rgba(239,68,68,0.24)" },
  mint: { text: "#0f766e", soft: "rgba(13,148,136,0.10)", ring: "rgba(13,148,136,0.24)" },
};

export function GlassCard({ children, className = "", glow, style, hover = true, onClick, active }) {
  const highlight = "inset 0 1px 0 rgba(255,255,255,0.7)";
  const restShadow = glow
    ? `0 0 0 1px ${glow}, 0 12px 22px -18px rgba(15, 23, 42, 0.22), ${highlight}`
    : `0 12px 24px -18px rgba(15, 23, 42, 0.2), ${highlight}`;
  return (
    <motion.div
      className={`glass-panel card-surface ${active ? "card-active" : ""} ${className}`}
      style={{ boxShadow: restShadow, ...style }}
      onClick={onClick}
      whileHover={hover ? { y: -1, boxShadow: `0 14px 24px -18px rgba(15, 23, 42, 0.24), 0 0 0 1px rgba(148, 163, 184, 0.18), ${highlight}` } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, icon: Icon, tone = "cyan" }) {
  const t = TONE[tone];
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Icon && <Icon size={12} style={{ color: t.text }} />}
      <span className="eyebrow" style={{ color: t.text }}>{children}</span>
    </div>
  );
}
