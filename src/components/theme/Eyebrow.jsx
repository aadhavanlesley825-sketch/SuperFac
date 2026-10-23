import React from "react";
import { TONE } from "./tokens.js";

export function Eyebrow({ children, icon: Icon, tone = "cyan" }) {
  const t = TONE[tone] || TONE.cyan;
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Icon && <Icon size={13} style={{ color: t.text }} />}
      <span className="eyebrow" style={{ color: t.text }}>{children}</span>
    </div>
  );
}

export default Eyebrow;
