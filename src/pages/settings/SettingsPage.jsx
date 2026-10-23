import React, { useState } from "react";
import { SlidersHorizontal, Bell, Users } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";

function Field({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200 last:border-0">
      <div className="min-w-0 flex-1 pr-3">
        <div className="text-sm text-slate-800">{label}</div>
        {hint && <div className="text-[0.72rem] text-slate-500 mt-0.5 break-words">{hint}</div>}
      </div>
      <div className="flex-shrink-0 w-11 flex items-center justify-end">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  const trackWidth = 44;
  const thumbSize = 18;
  const inset = 3;
  const onLeft = trackWidth - thumbSize - inset;

  return (
    <button
      type="button"
      aria-label={checked ? "Enabled" : "Disabled"}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center rounded-full border border-transparent transition-colors duration-200 ease-out"
      style={{
        width: trackWidth,
        height: 24,
        minWidth: trackWidth,
        minHeight: 24,
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        background: checked ? "rgba(245,158,11,0.45)" : "rgba(148, 163, 184, 0.24)",
        boxShadow: checked ? "inset 0 0 0 1px rgba(180,83,9,0.18)" : "inset 0 0 0 1px rgba(148,163,184,0.14)",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: inset,
          left: checked ? onLeft : inset,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)",
          boxSizing: "border-box",
          transition: "left 0.2s ease, transform 0.2s ease",
          transform: checked ? "translateX(0)" : "translateX(0)",
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [vibThreshold, setVibThreshold] = useState(4.5);
  const [tempThreshold, setTempThreshold] = useState(80);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoWorkOrders, setAutoWorkOrders] = useState(true);

  return (
    <div className="max-w-[800px] mx-auto flex flex-col gap-6">
      <div>
        <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">Configuration</div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Anomaly thresholds, notification rules, and team access.</p>
      </div>

      <GlassCard className="p-6" hover={false}>
        <Eyebrow icon={SlidersHorizontal} tone="cyan">Detection thresholds</Eyebrow>
        <h3 className="text-base font-semibold text-slate-900 mb-2">Sensor sensitivity</h3>
        <Field label="Vibration alert threshold" hint="Flags an asset when radial vibration exceeds this value">
          <div className="flex items-center gap-2">
            <input type="range" min="2" max="9" step="0.1" value={vibThreshold}
              onChange={(e) => setVibThreshold(Number(e.target.value))} className="w-32 accent-amber-500" />
            <span className="mono text-sm w-14 text-right">{vibThreshold.toFixed(1)} mm/s</span>
          </div>
        </Field>
        <Field label="Temperature alert threshold" hint="Flags an asset when surface temperature exceeds this value">
          <div className="flex items-center gap-2">
            <input type="range" min="50" max="100" step="1" value={tempThreshold}
              onChange={(e) => setTempThreshold(Number(e.target.value))} className="w-32 accent-amber-500" />
            <span className="mono text-sm w-14 text-right">{tempThreshold}°C</span>
          </div>
        </Field>
      </GlassCard>

      <GlassCard className="p-6" hover={false}>
        <Eyebrow icon={Bell} tone="amber">Notifications</Eyebrow>
        <h3 className="text-base font-semibold text-slate-900 mb-2">Alert delivery</h3>
        <Field label="Email alerts" hint="Send critical alerts to plant managers by email">
          <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
        </Field>
        <Field label="SMS alerts" hint="Send critical alerts as SMS to on-call technicians">
          <Toggle checked={smsAlerts} onChange={setSmsAlerts} />
        </Field>
        <Field label="Auto-generate work orders" hint="Create a maintenance work order automatically when RUL drops below 14 days">
          <Toggle checked={autoWorkOrders} onChange={setAutoWorkOrders} />
        </Field>
      </GlassCard>

      <GlassCard className="p-6" hover={false}>
        <Eyebrow icon={Users} tone="mint">Team & access</Eyebrow>
        <h3 className="text-base font-semibold text-slate-900 mb-2">Roles</h3>
        {[
          { name: "R. Suresh", role: "Plant Manager · Nike Chennai Manufacturing Facility" },
          { name: "A. Fernandes", role: "Reliability Engineer · Nike Chennai Manufacturing Facility" },
          { name: "P. Iyer", role: "Maintenance Technician · Nike Chennai Manufacturing Facility" },
        ].map((p) => (
          <Field key={p.name} label={p.name} hint={p.role}>
            <span className="text-xs text-slate-500">Editor</span>
          </Field>
        ))}
      </GlassCard>
    </div>
  );
}
