import React from "react";
import { motion } from "framer-motion";

export function GlassCard({ children, className = "", glow, style, hover = true, onClick, active }) {
  return (
    <motion.div
      className={`glass-panel card-surface ${active ? "card-active" : ""} ${className}`}
      style={{ boxShadow: "none", ...style }}
      onClick={onClick}
      whileHover={hover ? { y: -1 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default GlassCard;
