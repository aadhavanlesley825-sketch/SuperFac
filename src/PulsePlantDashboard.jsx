import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart,
} from "recharts";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import {
  Factory, AlertTriangle,
  Gauge, PackageSearch, Radio, Clock, Sparkles, ShieldAlert, Wrench,
  ChevronRight, Zap, Boxes, Timer, Search, ArrowUpRight, ArrowDownRight,
  Bell, X, Rss,
} from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "./pulseplant-theme.jsx";
import ConveyorPanel from "./Conveyor3D.jsx";

/* ------------------------------------------------------------------ */
/*  PulsePlant — AI Factory Operations Command Center                  */
/*  Design language: "Control Deck" — graphite glass panels lit by     */
/*  two signal colors: amber (the physical plant floor) and cyan       */
/*  (the AI/data pulse reading it). A live ECG-style waveform in the   */
/*  header is the literal "pulse" the product is named for.            */
/*                                                                      */
/*  This pass layers in production-grade interaction & motion on top   */
/*  of the existing visual system — no redesign, additive only.        */
/* ------------------------------------------------------------------ */

/* ---------------------------- RNG utils ---------------------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260722);
const between = (min, max) => min + rand() * (max - min);

/* --------------------------- Mock data ------------------------------ */
const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

const BASELINE_DEFECT_RATE = 1.8; // rolling 30-batch baseline used by the z-score model
const FLAG_HOUR = "11:00"; // hour the deviation crossed the 3σ threshold

function genTrend() {
  let base = 1450;
  const rows = HOURS.map((h, i) => {
    base += between(-60, 90);
    const defect = Math.max(0.6, BASELINE_DEFECT_RATE + Math.sin(i / 3) * 0.3 + between(-0.2, 0.25));
    return {
      hour: h,
      production: Math.round(base),
      defectRate: Number(defect.toFixed(2)),
    };
  });
  // Seed the Batch 4471 deviation: defect rate spikes on Supplier Batch 4471's
  // run, crosses the statistical threshold, then falls once the recommended
  // hold + reroute (Recommend + Coordinate Recovery) takes effect.
  const idx = HOURS.indexOf(FLAG_HOUR);
  if (idx > -1) {
    rows[idx - 1].defectRate = Number((BASELINE_DEFECT_RATE + 1.9).toFixed(2));
    rows[idx].defectRate = Number((BASELINE_DEFECT_RATE + 3.1).toFixed(2));      // 4.3σ deviation flagged here
    rows[idx + 1].defectRate = Number((BASELINE_DEFECT_RATE + 1.3).toFixed(2));  // batch held, defect rate easing
    rows[idx + 2].defectRate = Number((BASELINE_DEFECT_RATE + 0.2).toFixed(2));  // back near baseline
  }
  return rows;
}

const LINES = ["Line A · Chassis Stamping", "Line B · Injection Molding", "Line C · PCB Assembly", "Line D · Final QA"];
const SUPPLIERS_LIST = ["SteelCore Industries", "AlloyWorks Pvt Ltd", "Precision Metals Co", "NovaComponents", "Vantage Alloys"];
const STATUSES = [
  { key: "Passed", tone: "cyan" },
  { key: "Flagged", tone: "rose" },
  { key: "Under Review", tone: "amber" },
];

function genBatches(n) {
  return Array.from({ length: n }, (_, i) => {
    const isFlagged = i === 1; // Batch 4471 — the seeded root-cause batch
    const s = isFlagged ? STATUSES[1] : (rand() > 0.85 ? STATUSES[2] : STATUSES[0]);
    const defect = isFlagged ? between(6.4, 7.6) : s.key === "Under Review" ? between(2.1, 3.6) : between(0.2, 1.6);
    const hh = 7 + Math.floor(i * 0.9);
    const mm = Math.floor(between(0, 59)).toString().padStart(2, "0");
    return {
      id: isFlagged ? "B-4471" : `B-${2270 + i * 7}`,
      line: isFlagged ? "Line B · Injection Molding" : LINES[i % LINES.length],
      units: isFlagged ? Math.round(between(600, 680)) : Math.round(between(180, 640)),
      defectRate: Number(defect.toFixed(2)),
      status: s.key,
      tone: s.tone,
      supplier: isFlagged ? "AlloyWorks Pvt Ltd" : SUPPLIERS_LIST[i % SUPPLIERS_LIST.length],
      shift: "B",
      time: `${hh.toString().padStart(2, "0")}:${mm}`,
    };
  }).reverse();
}

const TIMELINE = [
  { stage: "① Detect", time: "10:41 AM", title: "Defect-rate deviation flagged", desc: "Line B quality-reject rate crossed the rolling 30-batch baseline by 4.3σ — well past the statistical threshold.", icon: Radio, tone: "rose" },
  { stage: "② Diagnose", time: "10:45 AM", title: "Root cause isolated to Batch 4471", desc: "Merging production, quality and supplier-batch logs on Batch-ID + Shift traced the spike to Supplier Batch 4471 (AlloyWorks).", icon: Search, tone: "cyan" },
  { stage: "③ Recommend", time: "10:47 AM", title: "Corrective action generated", desc: "System recommended: hold remaining units from Batch 4471 pending inspection.", icon: Wrench, tone: "amber" },
  { stage: "④ Coordinate Recovery", time: "10:52 AM", title: "Line B queue reprioritized", desc: "Downstream orders rerouted around the held batch so Line B assembly keeps running without a full stoppage.", icon: Boxes, tone: "mint" },
];

const SUPPLIER_SHARE = [
  { name: "SteelCore Industries", value: 32 },
  { name: "AlloyWorks Pvt Ltd", value: 24 },
  { name: "Precision Metals Co", value: 18 },
  { name: "NovaComponents", value: 14 },
  { name: "Others", value: 12 },
];

const DEFECT_CATEGORIES = [
  { name: "Dimensional Variance", count: 34 },
  { name: "Surface Scratch", count: 27 },
  { name: "Assembly Misalign", count: 19 },
  { name: "Thermal Warping", count: 14 },
  { name: "Contamination", count: 6 },
];

/* --------------------------- Activity feed pool --------------------------- */
const ACTIVITY_POOL = [
  { text: "Line A changeover complete — back to full rate", icon: Boxes, tone: "mint", anomaly: false },
  { text: "Quality check passed for Batch B-2312", icon: ShieldAlert, tone: "cyan", anomaly: false },
  { text: "Line C throughput holding steady at target", icon: Gauge, tone: "cyan", anomaly: false },
  { text: "AlloyWorks acknowledged the hold request", icon: Boxes, tone: "amber", anomaly: false },
  { text: "Line D final QA cleared 3 consecutive batches", icon: ShieldAlert, tone: "mint", anomaly: false },
  { text: "Shift handoff notes synced to Line B log", icon: Rss, tone: "cyan", anomaly: false },
  { text: "Defect-rate deviation flagged on Line C", icon: Radio, tone: "rose", anomaly: true },
  { text: "Supplier batch variance crossed 2σ on Line A", icon: AlertTriangle, tone: "rose", anomaly: true },
];

/* ----------------------------- Small utils ----------------------------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
  }, []);
  return reduced;
}

let toastSeq = 0;
let feedSeq = 0;

/* ----------------------------- Animated number ----------------------------- */
function AnimatedNumber({ value, format, duration = 0.9 }) {
  const reduced = usePrefersReducedMotion();
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    if (first.current) { first.current = false; setDisplay(value); mv.set(value); return; }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format(display)}</>;
}

/* ----------------------------- Pulse waveform -------------------------- */
function PulseWaveform({ tone = "cyan" }) {
  const t = TONE[tone];
  const path = "M0,20 L20,20 L28,20 L34,4 L42,36 L50,20 L58,20 L64,10 L70,30 L76,20 L120,20";
  return (
    <div className="pulse-wrap" aria-hidden="true">
      <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="pulse-svg">
        <path d={path} fill="none" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(120,0)" />
      </svg>
    </div>
  );
}

/* -------------------------------- Header -------------------------------- */
function Header({ tick, flaggedCount }) {
  const now = useMemo(() => new Date(), [tick]);
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-panel rounded-3xl px-6 py-5 mb-6 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <motion.div className="logo-mark" whileHover={{ rotate: -6, scale: 1.06 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
          <img src={`${import.meta.env.BASE_URL}superfac-logo.svg`} alt="SuperFac logo" className="logo-mark-img" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="app-title">SuperFac</h1>
            <span className="tag-chip">Production · Quality · Supplier</span>
          </div>
          <p className="app-sub">Nike Chennai Manufacturing Facility &nbsp;·&nbsp; Shift B (14:00 – 22:00) &nbsp;·&nbsp; {timeStr}</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-4">
        <PulseWaveform tone="cyan" />
      </div>

      <div className="flex items-center gap-3">
        <div className="live-badge">
          <span className="live-dot" />
          Live
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-sm" style={{ color: "#F0A93B" }}>
          <ShieldAlert size={15} />
          {flaggedCount} batch{flaggedCount === 1 ? "" : "es"} flagged · under review
        </div>
      </div>
    </motion.header>
  );
}

/* -------------------------------- KPI card -------------------------------- */
function KpiCard({ icon: Icon, tone, label, value, format, staticValue, sub, delta, deltaGood, index }) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: "easeOut" }}
    >
      <GlassCard className="p-5 h-full kpi-hover">
        <div className="flex items-start justify-between">
          <motion.div className="icon-badge" style={{ background: t.soft }} whileHover={{ scale: 1.12, rotate: 6 }} transition={{ type: "spring", stiffness: 350, damping: 12 }}>
            <Icon size={17} style={{ color: t.text }} />
          </motion.div>
          {delta && (
            <div className={`delta-chip ${deltaGood ? "delta-up" : "delta-down"}`}>
              {deltaGood ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {delta}
            </div>
          )}
        </div>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value">
          {staticValue !== undefined ? staticValue : <AnimatedNumber value={value} format={format} />}
        </p>
        <p className="kpi-sub">{sub}</p>
      </GlassCard>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tooltip-row">
          <span style={{ color: p.color }}>●</span>
          {p.dataKey === "production" ? " Units" : " Defect rate"}
          <span className="tooltip-val">{p.dataKey === "production" ? p.value.toLocaleString() : `${p.value}%`}</span>
        </p>
      ))}
    </div>
  );
}

/* --------------------------- AI Insight card --------------------------- */
function ConfidenceRing({ value }) {
  const r = 30, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke="#3FD0EA" strokeWidth="7"
          strokeDasharray={c} strokeLinecap="round"
          transform="rotate(-90 40 40)"
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={value}
          className="ring-value"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  );
}

const DEFAULT_RECS = [
  { icon: Wrench, label: "Recommend", text: "Hold remaining units from Batch 4471 pending inspection." },
  { icon: ShieldAlert, label: "Recommend", text: "Notify AlloyWorks quality team and request corrective certification." },
  { icon: Boxes, label: "Coordinate Recovery", text: "Reprioritize downstream Line B orders around the held batch so assembly doesn't stall." },
];

const DEFAULT_INSIGHT = {
  flagged: true,
  confidence: 91,
  kicker: "Root cause — ② Diagnose",
  title: "Batch 4471 · AlloyWorks Pvt Ltd",
  meta: "Flagged 10:41 AM · Line B · Injection Molding",
  reason: "Cross-referencing production counts, quality-reject logs and supplier batch IDs on Batch-ID + Shift, the model traced a 3.4× rise in dimensional-variance defects on Line B to Supplier Batch 4471 — a 4.3σ deviation above the rolling 30-batch baseline.",
  detail: "The model isolates this pattern by scoring every batch's rolling z-score against the 30-batch trailing baseline (μ = 1.8%, σ ≈ 0.34%), then cross-joining on Batch-ID + Shift so a spike in defects lines up with the exact supplier lot that produced it — not just the time window it happened in.",
  early: "Caught ~9 days / ~1,840 units before the next scheduled quality audit.",
  recs: DEFAULT_RECS,
  ctaLabel: "Hold Batch 4471",
};

function buildInsight(focus, trend, batches) {
  if (focus.type === "batch") {
    const b = batches.find((x) => x.id === focus.id);
    if (!b) return DEFAULT_INSIGHT;
    if (b.id === "B-4471") return DEFAULT_INSIGHT;
    const flagged = b.status === "Flagged";
    const review = b.status === "Under Review";
    return {
      flagged,
      confidence: flagged ? 88 : review ? 64 : 97,
      kicker: flagged ? "Root cause — ② Diagnose" : review ? "Pending review" : "No anomaly detected",
      title: `${b.id} · ${b.supplier}`,
      meta: `${b.line} · Shift ${b.shift} · ${b.time}`,
      reason: flagged
        ? `Defect rate of ${b.defectRate}% is well above the ${BASELINE_DEFECT_RATE}% baseline for this line — consistent with the Batch 4471 pattern.`
        : review
        ? `Defect rate of ${b.defectRate}% sits above baseline but hasn't crossed the statistical threshold yet — held for manual review.`
        : `Defect rate of ${b.defectRate}% sits within normal range of the ${BASELINE_DEFECT_RATE}% rolling baseline — no corrective action needed.`,
      detail: `${b.units.toLocaleString()} units logged from ${b.supplier} on ${b.line}, shift ${b.shift} at ${b.time}, scored against the rolling 30-batch baseline of ${BASELINE_DEFECT_RATE}%.`,
      early: null,
      recs: [],
      ctaLabel: flagged ? `Hold ${b.id}` : null,
    };
  }
  return DEFAULT_INSIGHT;
}

function AIInsightCard({ insight }) {
  const [hovered, setHovered] = useState(false);
  const t = insight.flagged ? TONE.rose : TONE.mint;
  return (
    <GlassCard
      className="p-6 h-full"
      glow={insight.flagged ? "rgba(241,113,122,0.28)" : "rgba(63,208,234,0.28)"}
      onClick={undefined}
    >
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className="flex items-center justify-between">
          <Eyebrow icon={Sparkles} tone={insight.flagged ? "rose" : "cyan"}>AI Insight · Explainable</Eyebrow>
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className="hover-hint"
              >
                hover to expand
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <ConfidenceRing value={insight.confidence} />
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "#5C6875" }}>{insight.kicker}</p>
                <h3 className="panel-title leading-snug">{insight.title}</h3>
                <p className="kpi-sub mt-1">{insight.meta}</p>
              </div>
            </div>
            <p className="insight-reason">{insight.reason}</p>

            <motion.div
              className="insight-expand"
              initial={false}
              animate={{ maxHeight: hovered ? 160 : 0, opacity: hovered ? 1 : 0, marginTop: hovered ? 10 : 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <p className="insight-detail">{insight.detail}</p>
            </motion.div>

            {insight.early && (
              <div className="early-warning-strip">
                <Zap size={13} style={{ color: "#5FD9AE" }} />
                <span>{insight.early}</span>
              </div>
            )}

            {insight.recs.length > 0 && (
              <>
                <div className="divider" />
                <p className="text-xs uppercase tracking-wide mb-2.5" style={{ color: "#5C6875" }}>③ Recommend &nbsp;→&nbsp; ④ Coordinate Recovery</p>
                <div className="flex flex-col gap-2.5 mb-5">
                  {insight.recs.map((r, i) => (
                    <motion.div
                      key={i}
                      className="rec-row"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.3 }}
                    >
                      <r.icon size={14} style={{ color: r.label === "Recommend" ? "#F0A93B" : "#5FD9AE" }} />
                      <span>{r.text}</span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {insight.ctaLabel ? (
              <div className="flex gap-3 mt-2">
                <motion.button className="btn-primary" whileTap={{ scale: 0.96 }}>
                  {insight.ctaLabel} <ChevronRight size={14} />
                </motion.button>
                <motion.button className="btn-ghost" whileTap={{ scale: 0.96 }}>Dismiss</motion.button>
              </div>
            ) : (
              <p className="insight-quiet mt-2">Select a chart point or batch row to inspect it here.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}

/* --------------------------- Batches table --------------------------- */
function StatusPill({ status, tone }) {
  const t = TONE[tone];
  return (
    <motion.span
      className={`status-pill ${status === "Flagged" ? "pill-pulse" : ""}`}
      style={{ color: t.text, background: t.soft }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
    >
      {status}
    </motion.span>
  );
}

function BatchTable({ rows, focusId, onRowClick }) {
  return (
    <GlassCard className="p-6">
      <Eyebrow icon={Boxes} tone="mint">Production log</Eyebrow>
      <h3 className="panel-title mb-4">Recent Production Batches</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm batch-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Line</th>
              <th>Units</th>
              <th>Defect %</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Shift / Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.03 * i }}
                onClick={() => onRowClick(b.id)}
                className={`batch-row ${focusId === b.id ? "batch-row-active" : ""}`}
              >
                <td className="mono">{b.id}</td>
                <td className="text-secondary">{b.line}</td>
                <td className="mono">{b.units}</td>
                <td className="mono">{b.defectRate}%</td>
                <td><StatusPill status={b.status} tone={b.tone} /></td>
                <td className="text-secondary">{b.supplier}</td>
                <td className="mono text-tertiary">{b.shift} · {b.time}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* --------------------------- Detection timeline --------------------------- */
function DetectionTimeline({ events }) {
  return (
    <GlassCard className="p-6 h-full">
      <Eyebrow icon={Clock} tone="amber">Response trace</Eyebrow>
      <h3 className="panel-title mb-5">Detection Timeline</h3>
      <div className="flex flex-col">
        {events.map((e, i) => {
          const t = TONE[e.tone];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="timeline-row"
            >
              <div className="timeline-rail">
                <div className="timeline-dot" style={{ background: t.text, boxShadow: `0 0 0 4px ${t.soft}` }}>
                  <e.icon size={11} color="#0A0E13" />
                </div>
                {i < events.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="tag-chip">{e.stage}</span>
                  <span className="mono text-tertiary text-xs">{e.time}</span>
                </div>
                <p className="timeline-title mt-1">{e.title}</p>
                <p className="timeline-desc">{e.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* --------------------------- Supplier donut --------------------------- */
const DONUT_COLORS = ["#3FD0EA", "#F0A93B", "#5FD9AE", "#F1717A", "#7C8CA6"];

function SupplierDonut({ data }) {
  return (
    <GlassCard className="p-6 h-full">
      <Eyebrow icon={PackageSearch} tone="cyan">Sourcing mix</Eyebrow>
      <h3 className="panel-title mb-4">Supplier Distribution</h3>
      <div className="h-64 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={3} stroke="none" isAnimationActive animationDuration={900} animationEasing="ease-out">
              {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-secondary">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              {d.name}
              {d.name === "AlloyWorks Pvt Ltd" && <AlertTriangle size={11} style={{ color: "#F0A93B" }} />}
            </span>
            <span className="mono text-tertiary">{d.value}%</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="tooltip-row"><span style={{ color: p.payload.fill }}>●</span> {p.name} <span className="tooltip-val">{p.value}%</span></p>
    </div>
  );
}

/* --------------------------- Defect bar chart --------------------------- */
function DefectBarChart({ data }) {
  return (
    <GlassCard className="p-6 h-full">
      <Eyebrow icon={AlertTriangle} tone="rose">Root causes</Eyebrow>
      <h3 className="panel-title mb-4">Defect Categories (this shift)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" stroke="#5C6875" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" stroke="#8D9AA8" fontSize={11.5} tickLine={false} axisLine={false} width={130} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive animationDuration={900} animationEasing="ease-out">
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? "#F1717A" : "#F0A93B"} fillOpacity={1 - i * 0.13} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* --------------------------- Live activity feed --------------------------- */
function LiveActivityFeed({ items }) {
  return (
    <GlassCard className="p-6 h-full">
      <div className="flex items-center justify-between mb-1">
        <Eyebrow icon={Rss} tone="mint">Floor signal</Eyebrow>
        <span className="live-badge live-badge-sm">
          <span className="live-dot" />
          Live
        </span>
      </div>
      <h3 className="panel-title mb-4">Live Activity</h3>
      <div className="activity-list">
        {items.length === 0 ? (
          <div className="activity-empty">
            <Rss size={16} style={{ color: "#5C6875" }} />
            <span>Waiting for floor activity…</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const t = TONE[it.tone];
              return (
                <motion.div
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="activity-row"
                >
                  <span className="activity-icon" style={{ background: t.soft }}>
                    <it.icon size={12} style={{ color: t.text }} />
                  </span>
                  <span className="activity-text">{it.text}</span>
                  <span className="activity-time mono">{it.time}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}

/* --------------------------- Toasts --------------------------- */
/* --------------------------- Insight connector overlay --------------------------- */
// Draws a live SVG line from the tracked product inside the 3D scene (marked by
// productAnchorRef, a tiny DOM node kept in sync with world-space via drei's <Html>)
// to the AI Insight card (insightAnchorRef). Positions are read imperatively on a
// rAF loop and written straight to the SVG path — no React state per frame, so this
// stays cheap even while the conveyor scene is animating at 60fps alongside it.
function InsightConnector({ active, productAnchorRef, insightAnchorRef, stageRef }) {
  const pathRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    let raf;
    const tick = () => {
      if (
        active &&
        productAnchorRef.current &&
        insightAnchorRef.current &&
        stageRef.current &&
        pathRef.current
      ) {
        const stageBox = stageRef.current.getBoundingClientRect();
        const a = productAnchorRef.current.getBoundingClientRect();
        const b = insightAnchorRef.current.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - stageBox.left;
        const y1 = a.top + a.height / 2 - stageBox.top;
        const x2 = b.left - stageBox.left;
        const y2 = b.top + 44 - stageBox.top;
        const midX = (x1 + x2) / 2;
        pathRef.current.setAttribute("d", `M ${x1} ${y1} Q ${midX} ${y1} ${x2} ${y2}`);
        if (dotRef.current) {
          dotRef.current.setAttribute("cx", x1);
          dotRef.current.setAttribute("cy", y1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, productAnchorRef, insightAnchorRef, stageRef]);

  return (
    <svg className={`insight-connector ${active ? "is-active" : ""}`} aria-hidden="true">
      <path ref={pathRef} className="connector-path" />
      <circle ref={dotRef} r="4" className="connector-dot" />
    </svg>
  );
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.94, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="toast-card"
            onClick={() => onDismiss(t.id)}
          >
            <span className="toast-icon">
              <Bell size={14} style={{ color: TONE.rose.text }} />
            </span>
            <div className="toast-body">
              <p className="toast-title">New anomaly detected</p>
              <p className="toast-desc">{t.message}</p>
            </div>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}>
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- Skeleton loading state --------------------------- */
function Skel({ className = "", style }) {
  return <div className={`skel ${className}`} style={style} />;
}

function SkeletonDashboard() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="glass-panel rounded-3xl px-6 py-5 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skel style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div className="flex flex-col gap-2">
            <Skel style={{ width: 160, height: 16, borderRadius: 6 }} />
            <Skel style={{ width: 220, height: 11, borderRadius: 6 }} />
          </div>
        </div>
        <Skel style={{ width: 90, height: 26, borderRadius: 999 }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel rounded-3xl p-5">
            <Skel style={{ width: 34, height: 34, borderRadius: 10, marginBottom: 14 }} />
            <Skel style={{ width: "60%", height: 11, borderRadius: 6, marginBottom: 10 }} />
            <Skel style={{ width: "45%", height: 22, borderRadius: 6, marginBottom: 8 }} />
            <Skel style={{ width: "80%", height: 10, borderRadius: 6 }} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="xl:col-span-2 flex flex-col gap-5">
          <div className="glass-panel rounded-3xl p-6">
            <Skel style={{ width: 140, height: 11, borderRadius: 6, marginBottom: 16 }} />
            <Skel style={{ width: "100%", height: 260, borderRadius: 12 }} />
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <Skel style={{ width: 160, height: 11, borderRadius: 6, marginBottom: 16 }} />
            {[0, 1, 2, 3].map((i) => (
              <Skel key={i} style={{ width: "100%", height: 34, borderRadius: 8, marginBottom: 8 }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="glass-panel rounded-3xl p-6">
            <Skel style={{ width: 120, height: 11, borderRadius: 6, marginBottom: 16 }} />
            <Skel style={{ width: "100%", height: 160, borderRadius: 12 }} />
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <Skel style={{ width: 120, height: 11, borderRadius: 6, marginBottom: 16 }} />
            <Skel style={{ width: "100%", height: 160, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------- App -------------------------------- */
export default function PulsePlantDashboard() {
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [trend] = useState(genTrend);
  const [batches] = useState(() => genBatches(8));
  const [live, setLive] = useState({ production: 18420, defect: 2.31, leadDays: 9, leadUnits: 1840 });
  const [focus, setFocus] = useState({ type: "batch", id: "B-4471" });
  const [toasts, setToasts] = useState([]);
  const [feed, setFeed] = useState([]);
  const feedRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setLive((prev) => ({
        production: prev.production + Math.round(between(4, 22)),
        defect: Number(Math.max(0.8, prev.defect + between(-0.05, 0.04)).toFixed(2)),
        leadDays: prev.leadDays,
        leadUnits: prev.leadUnits + Math.round(between(0, 3)),
      }));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const pushToast = useCallback((message) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);

  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      feedRef.current += 1;
      const isAnomalyRoll = feedRef.current > 1 && rand() > 0.72;
      const pool = ACTIVITY_POOL.filter((p) => p.anomaly === isAnomalyRoll);
      const item = pool[Math.floor(rand() * pool.length)] || ACTIVITY_POOL[0];
      const now = new Date();
      const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const entry = { id: ++feedSeq, ...item, time };
      setFeed((prev) => [entry, ...prev].slice(0, 6));
      if (item.anomaly) pushToast(item.text);
    }, 5200);
    return () => clearInterval(id);
  }, [loading, pushToast]);

  const flaggedCount = batches.filter((b) => b.status === "Flagged").length;
  const insight = useMemo(() => buildInsight(focus, trend, batches), [focus, trend, batches]);

  const handleRowClick = useCallback((id) => setFocus({ type: "batch", id }), []);
  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // Bridges the 3D scene (inside the Canvas) to the AI Insight card (plain DOM):
  // productAnchorRef is a tiny invisible marker kept in world-space by drei's <Html>
  // wherever the tracked product currently sits; insightAnchorRef marks the card;
  // stageRef is their shared positioning context for the connector-line overlay.
  const productAnchorRef = useRef(null);
  const insightAnchorRef = useRef(null);
  const stageRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [connectorActive, setConnectorActive] = useState(false);

  return (
    <div className="pp-root min-h-screen w-full px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .pp-root {
          background:
            radial-gradient(60rem 40rem at 8% -10%, rgba(240,169,59,0.10), transparent 60%),
            radial-gradient(50rem 40rem at 100% 10%, rgba(63,208,234,0.12), transparent 55%),
            linear-gradient(180deg, #0A0E13 0%, #0B1017 100%);
          font-family: 'Inter', sans-serif;
          color: #EAF0F5;
          position: relative;
        }
        .pp-root::before {
          content: "";
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(80% 60% at 50% 0%, black, transparent 100%);
        }
        .pp-root > * { position: relative; z-index: 1; }
        .pp-stage { position: relative; }

        .glass-panel {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: backdrop-filter 0.4s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .card-surface { will-change: transform; }
        .card-surface:hover { border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); }
        .card-active { border-color: rgba(63,208,234,0.45) !important; box-shadow: 0 0 0 1px rgba(63,208,234,0.3), 0 20px 50px -20px rgba(0,0,0,0.6); }
        .kpi-hover { transition: box-shadow 0.3s ease; }

        .logo-mark {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(140deg, #F0A93B, #3FD0EA);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; cursor: pointer;
        }
        .app-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; color: #F4F8FA;
        }
        .app-sub { font-size: 0.78rem; color: #8D9AA8; margin-top: 1px; }
        .tag-chip {
          font-size: 0.62rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(63,208,234,0.14); color: #3FD0EA;
          border: 1px solid rgba(63,208,234,0.3);
        }
        .live-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.78rem; font-weight: 500; color: #5FD9AE;
          background: rgba(95,217,174,0.12); border: 1px solid rgba(95,217,174,0.3);
          padding: 5px 12px; border-radius: 999px;
        }
        .live-badge-sm { font-size: 0.68rem; padding: 3px 9px; }
        .live-dot { width: 7px; height: 7px; border-radius: 999px; background: #5FD9AE; box-shadow: 0 0 0 0 rgba(95,217,174,0.6); animation: livepulse 1.8s infinite; }
        @keyframes livepulse { 0% { box-shadow: 0 0 0 0 rgba(95,217,174,0.55); } 70% { box-shadow: 0 0 0 8px rgba(95,217,174,0); } 100% { box-shadow: 0 0 0 0 rgba(95,217,174,0); } }
        .status-good { color: #8D9AA8; }

        .pulse-wrap { width: 100%; height: 34px; overflow: hidden; opacity: 0.85; }
        .pulse-svg { width: 200%; height: 100%; animation: pulseScroll 3.2s linear infinite; }
        @keyframes pulseScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .icon-badge { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .kpi-label { font-size: 0.78rem; color: #8D9AA8; margin-top: 14px; }
        .kpi-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.65rem; font-weight: 700; color: #F4F8FA; letter-spacing: -0.01em; margin-top: 2px; font-variant-numeric: tabular-nums; }
        .kpi-sub { font-size: 0.72rem; color: #5C6875; margin-top: 4px; }
        .delta-chip { display: flex; align-items: center; gap: 2px; font-size: 0.7rem; font-weight: 600; padding: 3px 7px; border-radius: 999px; }
        .delta-up { color: #5FD9AE; background: rgba(95,217,174,0.12); }
        .delta-down { color: #F1717A; background: rgba(241,113,122,0.12); }

        .eyebrow { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
        .panel-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 600; color: #F4F8FA; }
        .legend-dot { display: inline-flex; align-items: center; gap: 6px; color: #8D9AA8; }
        .legend-dot::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
        .chart-hint { color: #5C6875; font-style: italic; }

        .chart-tooltip { background: rgba(14,18,24,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 12px; backdrop-filter: blur(6px); }
        .tooltip-label { font-size: 0.7rem; color: #8D9AA8; margin-bottom: 2px; }
        .tooltip-row { font-size: 0.78rem; color: #EAF0F5; display: flex; align-items: center; gap: 5px; }
        .tooltip-val { font-family: 'JetBrains Mono', monospace; margin-left: 4px; color: #F4F8FA; }

        .ring-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.05rem; color: #3FD0EA; }
        .focus-dot { filter: drop-shadow(0 0 6px rgba(244,248,250,0.7)); }

        .insight-reason { font-size: 0.86rem; line-height: 1.55; color: #B7C1CB; }
        .insight-detail { font-size: 0.8rem; line-height: 1.55; color: #8D9AA8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; }
        .insight-quiet { font-size: 0.78rem; color: #5C6875; font-style: italic; }
        .hover-hint { font-size: 0.68rem; color: #5C6875; font-style: italic; }
        .early-warning-strip {
          display: flex; align-items: center; gap: 8px; margin-top: 12px;
          font-size: 0.78rem; color: #B9EFDC; background: rgba(95,217,174,0.1);
          border: 1px solid rgba(95,217,174,0.25); border-radius: 10px; padding: 8px 12px;
        }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0; }
        .rec-row { display: flex; align-items: flex-start; gap: 9px; font-size: 0.82rem; color: #C6CED6; line-height: 1.4; }

        .btn-primary { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; color: #0A0E13; background: #3FD0EA; padding: 9px 16px; border-radius: 12px; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px -6px rgba(63,208,234,0.5); }
        .btn-ghost { font-size: 0.82rem; font-weight: 500; color: #8D9AA8; padding: 9px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); transition: background 0.15s ease; }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); }

        .batch-table { border-collapse: collapse; }
        .batch-table th { text-align: left; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #5C6875; padding: 0 10px 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .batch-table td { padding: 11px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #DCE3E9; white-space: nowrap; }
        .batch-table tr:last-child td { border-bottom: none; }
        .batch-row { cursor: pointer; transition: background 0.2s ease; }
        .batch-row:hover td { background: rgba(255,255,255,0.035); }
        .batch-row-active td { background: rgba(63,208,234,0.07); }
        .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
        .text-secondary { color: #97A2AC; }
        .text-tertiary { color: #5C6875; }

        .status-pill { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
        .pill-pulse { animation: pillpulse 2.2s infinite; }
        @keyframes pillpulse { 0% { box-shadow: 0 0 0 0 rgba(241,113,122,0.4); } 70% { box-shadow: 0 0 0 6px rgba(241,113,122,0); } 100% { box-shadow: 0 0 0 0 rgba(241,113,122,0); } }

        .timeline-row { display: flex; gap: 12px; }
        .timeline-rail { display: flex; flex-direction: column; align-items: center; }
        .timeline-dot { width: 22px; height: 22px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .timeline-line { width: 2px; flex: 1; background: rgba(255,255,255,0.09); margin: 4px 0; }
        .timeline-title { font-size: 0.86rem; font-weight: 600; color: #F0F4F7; }
        .timeline-desc { font-size: 0.78rem; color: #8D9AA8; margin-top: 2px; line-height: 1.45; max-width: 42ch; }

        .activity-list { display: flex; flex-direction: column; gap: 8px; min-height: 160px; }
        .activity-row { display: flex; align-items: center; gap: 9px; padding: 8px 9px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .activity-icon { width: 24px; height: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .activity-text { font-size: 0.78rem; color: #C6CED6; line-height: 1.35; flex: 1; }
        .activity-time { font-size: 0.68rem; color: #5C6875; flex-shrink: 0; }
        .activity-empty { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #5C6875; padding: 24px 4px; justify-content: center; }

        .toast-stack { position: fixed; top: 20px; right: 20px; z-index: 60; display: flex; flex-direction: column; gap: 10px; max-width: 340px; }
        .toast-card {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px 14px; border-radius: 14px; cursor: pointer;
          background: rgba(20,24,30,0.92); border: 1px solid rgba(241,113,122,0.35);
          box-shadow: 0 20px 50px -18px rgba(0,0,0,0.7), 0 0 0 1px rgba(241,113,122,0.12);
          backdrop-filter: blur(14px);
        }
        .toast-icon { width: 26px; height: 26px; border-radius: 8px; background: rgba(241,113,122,0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .toast-title { font-size: 0.8rem; font-weight: 600; color: #F4F8FA; }
        .toast-desc { font-size: 0.74rem; color: #97A2AC; margin-top: 2px; line-height: 1.35; }
        .toast-close { color: #5C6875; margin-left: auto; flex-shrink: 0; }
        .toast-close:hover { color: #C6CED6; }

        .insight-connector { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 6; opacity: 0; transition: opacity 0.45s ease; overflow: visible; }
        .insight-connector.is-active { opacity: 1; }
        .connector-path { fill: none; stroke: #F1717A; stroke-width: 1.6; stroke-dasharray: 6 5; filter: drop-shadow(0 0 4px rgba(241,113,122,0.55)); animation: dashflow 0.9s linear infinite; }
        .connector-dot { fill: #F1717A; filter: drop-shadow(0 0 6px rgba(241,113,122,0.75)); }
        @keyframes dashflow { to { stroke-dashoffset: -22; } }

        .skel {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.06);
        }
        .skel::after {
          content: ""; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div ref={stageRef} className="mx-auto pp-stage" style={{ maxWidth: "1400px" }}>
        <InsightConnector
          active={connectorActive}
          productAnchorRef={productAnchorRef}
          insightAnchorRef={insightAnchorRef}
          stageRef={stageRef}
        />
        <AnimatePresence mode="wait">
          {loading ? (
            <SkeletonDashboard key="skeleton" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Header tick={tick} flaggedCount={flaggedCount} />

              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <KpiCard
                  index={0} icon={Gauge} tone="cyan" label="Production Output"
                  value={live.production} format={(v) => Math.round(v).toLocaleString()}
                  sub="Shift B units · target 20,000" delta="+4.2%" deltaGood
                />
                <KpiCard
                  index={1} icon={AlertTriangle} tone="rose" label="Defect Rate"
                  value={live.defect} format={(v) => `${v.toFixed(2)}%`}
                  sub="Quality stream · baseline 1.8%" delta="+0.5pp" deltaGood={false}
                />
                <KpiCard
                  index={2} icon={Timer} tone="mint" label="Early-Warning Lead Time"
                  staticValue={`${live.leadDays} days`}
                  sub={`≈${live.leadUnits.toLocaleString()} units caught before next audit`} delta="vs. manual audit" deltaGood
                />
                <KpiCard
                  index={3} icon={ShieldAlert} tone="amber" label="Flagged Supplier Batch"
                  staticValue="Batch 4471"
                  sub="AlloyWorks · Line B · held for inspection" delta="1 today" deltaGood={false}
                />
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
                <div className="xl:col-span-2 flex flex-col gap-5">
                  <ConveyorPanel
                    batches={batches}
                    focus={focus}
                    productAnchorRef={productAnchorRef}
                    onConnectorActiveChange={setConnectorActive}
                    mouseRef={mouseRef}
                  />
                  <BatchTable rows={batches} focusId={focus.type === "batch" ? focus.id : null} onRowClick={handleRowClick} />
                </div>
                <div className="flex flex-col gap-5">
                  <div ref={insightAnchorRef}>
                    <AIInsightCard insight={insight} />
                  </div>
                  <DetectionTimeline events={TIMELINE} />
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-4">
                <SupplierDonut data={SUPPLIER_SHARE} />
                <DefectBarChart data={DEFECT_CATEGORIES} />
                <LiveActivityFeed items={feed} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
