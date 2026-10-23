import React from "react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared design tokens + primitives.                                 */
/*  Pulled out of PulsePlantDashboard.jsx so the new Conveyor3D panel   */
/*  can reuse the exact same glass-card chrome without duplicating it   */
/*  or creating a circular import between the two files.                */
/* ------------------------------------------------------------------ */

export const TONE = {
  amber: { text: "#d97706", soft: "rgba(217,119,6,0.1)", ring: "rgba(217,119,6,0.24)" },
  cyan: { text: "#2563eb", soft: "rgba(37,99,235,0.1)", ring: "rgba(37,99,235,0.22)" },
  rose: { text: "#dc2626", soft: "rgba(220,38,38,0.08)", ring: "rgba(220,38,38,0.2)" },
  mint: { text: "#059669", soft: "rgba(5,150,105,0.08)", ring: "rgba(5,150,105,0.2)" },
};

export function GlassCard({ children, className = "", glow, style, hover = true, onClick, active }) {
  return (
    <motion.div
      className={`glass-panel rounded-3xl card-surface ${active ? "card-active" : ""} ${className}`}
      style={{ ...(glow ? { boxShadow: `0 0 0 1px ${glow}, 0 18px 44px -26px rgba(15, 23, 42, 0.18)` } : {}), ...style }}
      onClick={onClick}
      whileHover={hover ? { y: -2, boxShadow: "0 18px 40px -24px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(148, 163, 184, 0.18)" } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, icon: Icon, tone = "cyan" }) {
  const t = TONE[tone];
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Icon && <Icon size={13} style={{ color: t.text }} />}
      <span className="eyebrow" style={{ color: t.text }}>{children}</span>
    </div>
  );
}
