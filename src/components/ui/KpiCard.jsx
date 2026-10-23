import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GlassCard } from "../theme/GlassCard.jsx";
import { AnimatedNumber } from "./AnimatedNumber.jsx";

export function KpiCard({
  index = 0, icon: Icon, label,
  value, format, staticValue, sub, delta, deltaGood,
}) {
  const DeltaIcon = deltaGood ? ArrowUpRight : ArrowDownRight;
  const deltaTone = deltaGood
    ? { bg: "rgba(17,17,17,0.04)", color: "#111111" }
    : { bg: "rgba(17,17,17,0.04)", color: "#111111" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: "easeOut" }}
    >
      <GlassCard className="h-full border border-[#e9e4df] bg-white">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#efedea]">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#5f5b57]">
            {Icon && <Icon size={14} className="text-[#111111]" />}
            {label}
          </div>
          {delta && (
            <div
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-semibold"
              style={{ background: deltaTone.bg, color: deltaTone.color }}
            >
              <DeltaIcon size={12} />
              {delta}
            </div>
          )}
        </div>

        <div className="mt-4 text-[2rem] leading-none font-black tracking-[-0.08em] text-[#111111]">
          {staticValue ?? <AnimatedNumber value={value} format={format} />}
        </div>
        {sub && <div className="text-[0.76rem] text-[#6d6965] mt-2 leading-snug">{sub}</div>}
      </GlassCard>
    </motion.div>
  );
}

export default KpiCard;
