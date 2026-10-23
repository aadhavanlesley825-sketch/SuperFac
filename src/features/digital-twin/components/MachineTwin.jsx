import React from "react";
import { motion } from "framer-motion";
import { Radio, Activity, Thermometer, Gauge as GaugeIcon, Clock3 } from "lucide-react";
import { GlassCard } from "../../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../../components/theme/Eyebrow.jsx";
import { STATE, STATE_LABEL } from "../../../components/theme/tokens.js";
import { StatusPill } from "../../../components/ui/StatusPill.jsx";

function HealthRing({ score, tone }) {
  const r = 42, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke={tone.text} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        transform="rotate(-90 50 50)"
        style={{ filter: `drop-shadow(0 0 6px ${tone.ring})` }}
      />
      <text x="50" y="47" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">{score}</text>
      <text x="50" y="63" textAnchor="middle" fontSize="8" fill="#64748b">HEALTH</text>
    </svg>
  );
}

function MetricBlock({ icon: Icon, label, value, unit, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon size={14} style={{ color: tone.text }} />
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span>
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900">
        {value}
        <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

export default function MachineTwin({ machine }) {
  if (!machine) return null;
  const tone = STATE[machine.status] || STATE.monitoring;

  return (
    <GlassCard className="p-5 md:p-6" glow={tone.ring}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <Eyebrow icon={Radio} tone={machine.status === "critical" ? "rose" : "cyan"}>
          Digital twin · Live
        </Eyebrow>
        <StatusPill status={machine.status} pulse={machine.status === "critical"} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-5">
        <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-tight tracking-tight m-0">
          {machine.name}
        </h3>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="font-medium">{machine.plant}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex items-center gap-4">
          <HealthRing score={machine.healthScore} tone={tone} />
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.12em] text-slate-500">Health score</div>
            <div className="text-3xl font-bold leading-none text-slate-900">{machine.healthScore}</div>
            <div className="mt-1 text-xs text-slate-500">{STATE_LABEL[machine.status]}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricBlock icon={Activity} label="Vibration" value={machine.vibrationMm_s} unit="mm/s" tone={tone} />
          <MetricBlock icon={Thermometer} label="Temperature" value={machine.tempC} unit="°C" tone={tone} />
          <MetricBlock icon={GaugeIcon} label="RUL" value={`${machine.rulDays}d`} unit="" tone={tone} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
        <div className="text-[0.68rem] uppercase tracking-[0.12em] text-slate-500 mb-1.5">Predicted failure mode</div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold leading-snug" style={{ color: tone.text }}>
            {machine.failureMode}
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-slate-700">
            <Clock3 size={14} style={{ color: tone.text }} />
            <span>
              Estimated window <span className="font-semibold text-slate-900">{machine.rulDays} days</span>
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
