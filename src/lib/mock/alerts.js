import { MACHINES, filterChennaiMachines } from "./machines.js";

const chennaiMachines = filterChennaiMachines(MACHINES);
const critical = chennaiMachines.find((m) => m.status === "critical") ?? chennaiMachines[0];
const warning = chennaiMachines.find((m) => m.status === "warning") ?? chennaiMachines[1] ?? chennaiMachines[0];

export const DETECTION_TIMELINE = [
  {
    stage: "① Detect", time: "09:14 AM",
    title: `Vibration signature deviation on ${critical.name}`,
    desc: `Radial vibration crossed the rolling 30-day baseline by 4.1σ — well past the statistical threshold for ${critical.type.toLowerCase()} bearings.`,
    icon: "Radio", tone: "rose",
  },
  {
    stage: "② Diagnose", time: "09:19 AM",
    title: "Root cause isolated to bearing wear",
    desc: `Cross-referencing vibration spectrum, temperature and acoustic streams narrowed the fault to early-stage ${critical.failureMode.toLowerCase()}.`,
    icon: "Search", tone: "cyan",
  },
  {
    stage: "③ Predict", time: "09:21 AM",
    title: `Failure window: ${critical.rulDays} days`,
    desc: `Remaining-useful-life model estimates failure within ${critical.rulDays} days at current load if left unaddressed.`,
    icon: "Gauge", tone: "amber",
  },
  {
    stage: "④ Schedule", time: "09:24 AM",
    title: "Work order generated and prioritized",
    desc: `Maintenance queue reordered — ${critical.name} bearing replacement moved ahead of routine PM to avoid unplanned downtime.`,
    icon: "Wrench", tone: "mint",
  },
];

export const ALERTS = chennaiMachines.filter((m) => m.status === "warning" || m.status === "critical").map((m, i) => ({
  id: `A-${5100 + i * 7}`,
  machineId: m.id,
  machine: m.name,
  plant: m.plant,
  severity: m.status,
  failureMode: m.failureMode,
  rulDays: m.rulDays,
  message: m.status === "critical"
    ? `Critical: ${m.failureMode.toLowerCase()} predicted within ${m.rulDays} days`
    : `Warning: elevated vibration trend on ${m.name}`,
  raisedAt: `${8 + i}:${(12 + i * 7) % 60 < 10 ? "0" : ""}${(12 + i * 7) % 60} AM`,
  acknowledged: i % 3 === 0,
}));

export const ACTIVITY_POOL = [
  { text: "Line A gearbox lubrication completed on schedule", tone: "mint", anomaly: false },
  { text: "Vibration baseline recalibrated for Pump C2", tone: "cyan", anomaly: false },
  { text: "Thermal scan cleared on Compressor Unit D1", tone: "mint", anomaly: false },
  { text: `Bearing wear alert acknowledged for ${critical.name}`, tone: "amber", anomaly: false },
  { text: "Work order WO-2291 marked complete", tone: "cyan", anomaly: false },
  { text: "Acoustic sensor reconnected on Line B spindle", tone: "cyan", anomaly: false },
  { text: `Vibration signature deviation flagged on ${warning.name}`, tone: "rose", anomaly: true },
  { text: "Current-draw anomaly crossed 2σ on Motor A3", tone: "rose", anomaly: true },
];
