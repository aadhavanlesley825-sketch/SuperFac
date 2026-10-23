import { create } from "zustand";
import {
  HYDRAULIC_DATASET_METADATA,
  HYDRAULIC_DATASET_SAMPLE_CYCLES,
  buildHydraulicReadingsFromRecord,
  loadHydraulicDatasetRecords,
} from "../datasets/hydraulicSystem.js";
import { useFleetStore } from "./fleetStore.js";

/* ------------------------------------------------------------------ */
/*  PulsePlant · Digital Twin store                                    */
/*                                                                      */
/*  Owns the machine component registry, the dataset-driven sensor  */
/*  feed, derived health/severity per component, and the work-order   */
/*  state machine. Mirrors the conventions of `fleetStore.js` (zustand, */
/*  plain actions on the store) so it drops into the existing app       */
/*  shell without introducing a second state-management pattern.        */
/*                                                                      */
/*  Swap-in point for a real backend: replace `tickSensors()` with a    */
/*  websocket/poll handler that calls `ingestReading(componentId, obj)`, */
/*  and replace the work-order actions' local array mutation with API   */
/*  calls that resolve then call the same setters. Component shape,     */
/*  severity thresholds, and the WO_STATUSES pipeline are the contract  */
/*  the rest of the UI (MachineScene3D, DiagnosticsPanel, WorkOrders    */
/*  page) is built against, so keep those stable.                       */
/* ------------------------------------------------------------------ */

export const SEVERITY = {
  HEALTHY: "healthy",
  WARNING: "warning",
  CRITICAL: "critical",
};

export const SEVERITY_COLOR = {
  healthy: "#5FD9AE",
  warning: "#F0A93B",
  critical: "#F1717A",
};

export const WO_STATUSES = [
  "Open",
  "Assigned",
  "Accepted",
  "In Progress",
  "Waiting for Parts",
  "Testing",
  "Resolved",
  "Closed",
];

export const WO_PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const WORK_ORDER_SOURCES = ["Staff", "PulseAI"];

export const ROLES = ["Admin", "Plant Manager", "Engineer", "Technician"];

export const TECHNICIANS = [
  { id: "t-arun", name: "Arun Selvam", role: "Technician", crew: "Line B" },
  { id: "t-priya", name: "Priya Raman", role: "Engineer", crew: "Rotating Equipment" },
  { id: "t-devan", name: "Devan Kumar", role: "Technician", crew: "Line B" },
  { id: "t-noor", name: "Noor Fathima", role: "Engineer", crew: "Controls" },
];

export const FACILITY_CONTEXT = {
  plantName: "Nike Chennai Manufacturing Facility",
  site: "Chennai Industrial Park",
  lineName: "Sole Manufacturing Line 1",
  cellName: "Outsole Production Cell",
  process: "Precision sole moulding, trimming, and material transfer",
  shift: "Shift B · 14:00–22:00",
  region: "Tamil Nadu, India",
  summary:
    "AI-powered predictive maintenance digital twin for the Nike Chennai sole-manufacturing line. Monitor moulding quality, trim precision, and conveyor stability across the production flow.",
};

export const FACILITY_DEPARTMENTS = [
  { key: "all", label: "All assets" },
  { key: "moulding", label: "Moulding" },
  { key: "trimming", label: "Trimming" },
  { key: "conveyor", label: "Conveyor" },
];

/* -------------------------------- Component registry -------------------------------- */
// Positions are in the same world-space units as Conveyor3D.jsx (belt runs
// along X, roughly -5.5..5.5). Camera framing is consumed directly by
// MachineScene3D's focus rig on selection.
export const COMPONENTS = [
  {
    id: "motor",
    name: "Drive Motor",
    category: "Motor",
    position: [-3.7, 0.62, 0],
    camera: { position: [-3.7, 1.3, 2.4], target: [-3.7, 0.62, 0] },
    zone: "Press drive",
    sensors: ["temperature", "vibration", "rpm", "current", "noise"],
    baseline: { temperature: [55, 68], vibration: [1.0, 3.0], rpm: [1440, 1460], current: [18, 22], noise: [62, 70] },
    units: { temperature: "\u00b0C", vibration: "mm/s", rpm: "RPM", current: "A", noise: "dB" },
    drift: 0.017,
    installedYearsAgo: 3.2,
  },
  {
    id: "gearbox",
    name: "Reduction Gearbox",
    category: "Gearbox",
    position: [-2.35, 0.62, 0],
    camera: { position: [-2.35, 1.25, 2.2], target: [-2.35, 0.62, 0] },
    zone: "Power transmission",
    sensors: ["temperature", "vibration", "pressure", "noise"],
    baseline: { temperature: [50, 64], vibration: [0.8, 2.2], pressure: [2.8, 3.4], noise: [58, 66] },
    units: { temperature: "\u00b0C", vibration: "mm/s", pressure: "bar", noise: "dB" },
    drift: 0.021,
    installedYearsAgo: 3.2,
  },
  {
    id: "pump",
    name: "Hydraulic Pump",
    category: "Pump",
    position: [-3.45, 0.45, -0.85],
    camera: { position: [-3.45, 1.15, -1.4], target: [-3.45, 0.45, -0.85] },
    zone: "Hydraulic pump pack",
    sensors: ["temperature", "pressure", "vibration", "current"],
    baseline: { temperature: [48, 62], pressure: [3.0, 3.8], vibration: [1.2, 2.8], current: [15, 20] },
    units: { temperature: "°C", pressure: "bar", vibration: "mm/s", current: "A" },
    drift: 0.019,
    installedYearsAgo: 2.1,
  },
  {
    id: "valve-bank",
    name: "Valve Bank",
    category: "Valve",
    position: [0.9, 0.38, -1.0],
    camera: { position: [0.9, 1.1, -2.0], target: [0.9, 0.38, -1.0] },
    zone: "Hydraulic manifold",
    sensors: ["pressure", "temperature", "noise"],
    baseline: { pressure: [2.9, 3.5], temperature: [34, 46], noise: [52, 60] },
    units: { pressure: "bar", temperature: "°C", noise: "dB" },
    drift: 0.014,
    installedYearsAgo: 1.8,
  },
  {
    id: "cooler",
    name: "Oil Cooler",
    category: "Heat Exchanger",
    position: [2.8, 0.52, 0.95],
    camera: { position: [2.8, 1.25, 1.7], target: [2.8, 0.52, 0.95] },
    zone: "Hydraulic cooling loop",
    sensors: ["temperature", "pressure", "flow"],
    baseline: { temperature: [26, 36], pressure: [2.4, 3.0], flow: [12, 18] },
    units: { temperature: "°C", pressure: "bar", flow: "L/min" },
    drift: 0.011,
    installedYearsAgo: 2.7,
  },
  {
    id: "bearing-de",
    name: "Drive-End Bearing",
    category: "Bearing",
    position: [-1.2, 0.5, 0.32],
    camera: { position: [-1.2, 1.05, 1.9], target: [-1.2, 0.5, 0.32] },
    zone: "Drive-end spindle support",
    sensors: ["temperature", "vibration", "noise"],
    baseline: { temperature: [42, 55], vibration: [0.5, 1.8], noise: [50, 58] },
    units: { temperature: "\u00b0C", vibration: "mm/s", noise: "dB" },
    drift: 0.03,
    installedYearsAgo: 1.6,
    // This unit is the demo's slow-burn fault so the twin has something to
    // discover automatically instead of everything sitting green forever.
    faultStory: true,
  },
  {
    id: "bearing-nde",
    name: "Non-Drive-End Bearing",
    category: "Bearing",
    position: [-1.2, 0.5, -0.32],
    camera: { position: [-1.2, 1.05, -1.6], target: [-1.2, 0.5, -0.32] },
    zone: "Non-drive bearing support",
    sensors: ["temperature", "vibration", "noise"],
    baseline: { temperature: [42, 55], vibration: [0.5, 1.8], noise: [50, 58] },
    units: { temperature: "\u00b0C", vibration: "mm/s", noise: "dB" },
    drift: 0.014,
    installedYearsAgo: 1.6,
  },
  {
    id: "roller-in",
    name: "Infeed Roller",
    category: "Roller",
    position: [-0.1, 0.34, 0],
    camera: { position: [-0.1, 0.95, 1.9], target: [-0.1, 0.34, 0] },
    zone: "Transfer feed roller",
    sensors: ["vibration", "noise"],
    baseline: { vibration: [0.4, 1.6], noise: [48, 56] },
    units: { vibration: "mm/s", noise: "dB" },
    drift: 0.012,
    installedYearsAgo: 1.1,
  },
  {
    id: "roller-out",
    name: "Discharge Roller",
    category: "Roller",
    position: [2.0, 0.34, 0],
    camera: { position: [2.0, 0.95, 1.9], target: [2.0, 0.34, 0] },
    zone: "Discharge transfer roller",
    sensors: ["vibration", "noise"],
    baseline: { vibration: [0.4, 1.6], noise: [48, 56] },
    units: { vibration: "mm/s", noise: "dB" },
    drift: 0.012,
    installedYearsAgo: 1.1,
  },
  {
    id: "sensor-array",
    name: "IoT Sensor Array",
    category: "Sensor",
    position: [0.9, 1.05, 0.55],
    camera: { position: [0.9, 1.55, 2.0], target: [0.9, 1.05, 0.55] },
    zone: "Condition monitoring node",
    sensors: ["temperature", "current"],
    baseline: { temperature: [28, 38], current: [0.4, 0.9] },
    units: { temperature: "\u00b0C", current: "A" },
    drift: 0.008,
    installedYearsAgo: 0.6,
  },
  {
    id: "control-panel",
    name: "Control Panel",
    category: "Control Panel",
    position: [-4.9, 0.85, 1.1],
    camera: { position: [-4.9, 1.35, 2.7], target: [-4.9, 0.85, 1.1] },
    zone: "Control rack",
    sensors: ["temperature", "current"],
    baseline: { temperature: [24, 34], current: [2.5, 4.5] },
    units: { temperature: "\u00b0C", current: "A" },
    drift: 0.009,
    installedYearsAgo: 3.2,
  },
];

export const FACILITY_MACHINE_COMPONENTS = [
  {
    id: "moulding-press",
    name: "Moulding Press",
    category: "CNC",
    zone: "Moulding bay",
    position: [-5.2, 0.35, -0.35],
    camera: { position: [-5.4, 2.4, 4.8], target: [-5.2, 0.95, -0.35] },
    sensors: ["temperature", "vibration", "rpm", "current", "noise"],
    baseline: { temperature: [38, 52], vibration: [0.8, 2.2], rpm: [7800, 8200], current: [12, 18], noise: [62, 70] },
    units: { temperature: "°C", vibration: "mm/s", rpm: "RPM", current: "A", noise: "dB" },
    drift: 0.015,
    installedYearsAgo: 2.4,
    plant: "Nike Chennai Manufacturing Facility",
    status: "online",
  },
  {
    id: "trimming-machine",
    name: "Trimming Machine",
    category: "Robot",
    zone: "Trim & finish bay",
    position: [0.2, 0.35, 0.2],
    camera: { position: [0.1, 2.1, 4.5], target: [0.2, 1.1, 0.2] },
    sensors: ["temperature", "vibration", "current", "noise"],
    baseline: { temperature: [34, 46], vibration: [0.6, 1.8], current: [8, 13], noise: [54, 64] },
    units: { temperature: "°C", vibration: "mm/s", current: "A", noise: "dB" },
    drift: 0.013,
    installedYearsAgo: 1.9,
    plant: "Nike Chennai Manufacturing Facility",
    status: "running",
  },
  {
    id: "conveyor-system",
    name: "Conveyor System",
    category: "Conveyor",
    zone: "Transfer lane",
    position: [5.9, 0.18, 0.1],
    camera: { position: [5.9, 2.3, 5.0], target: [5.9, 0.8, 0.1] },
    sensors: ["temperature", "vibration", "rpm", "noise"],
    baseline: { temperature: [30, 42], vibration: [0.7, 1.6], rpm: [960, 1100], noise: [52, 60] },
    units: { temperature: "°C", vibration: "mm/s", rpm: "RPM", noise: "dB" },
    drift: 0.011,
    installedYearsAgo: 1.5,
    plant: "Nike Chennai Manufacturing Facility",
    status: "online",
  },
];

const ALL_COMPONENTS = [...COMPONENTS, ...FACILITY_MACHINE_COMPONENTS];
const COMPONENT_BY_ID = Object.fromEntries(ALL_COMPONENTS.map((c) => [c.id, c]));

const ROOT_CAUSES = {
  temperature: "Elevated thermal load, consistent with degraded lubrication or restricted cooling airflow.",
  vibration: "Rising vibration amplitude, consistent with bearing wear or a developing shaft misalignment.",
  rpm: "Speed instability, consistent with load fluctuation or a slipping drive coupling.",
  pressure: "Pressure drift, consistent with a seal leak or a partially blocked line.",
  current: "Current draw outside the normal envelope, consistent with increased mechanical resistance.",
  noise: "Acoustic signature drifting upward, consistent with surface wear or loosening hardware.",
};

const RECOMMENDED_ACTION = {
  healthy: "No action required. Continue routine monitoring.",
  warning: "Schedule an inspection within the next maintenance window; trend the flagged sensor closely.",
  critical: "Dispatch a technician for immediate inspection. Consider a controlled shutdown if the trend continues.",
};

const REPAIR_TIME_HOURS = {
  Motor: 3.5,
  Gearbox: 4,
  Bearing: 2,
  Roller: 1.5,
  Sensor: 0.75,
  Pump: 3,
  Valve: 2,
  "Heat Exchanger": 2.5,
  "Control Panel": 1.5,
  CNC: 5,
  Robot: 4,
  Conveyor: 2,
};

function seededHistory(component) {
  const base = [
    { date: "2025-11-02", action: "Scheduled lubrication service", technician: "Arun Selvam" },
    { date: "2025-06-14", action: "Vibration baseline recalibration", technician: "Priya Raman" },
  ];
  if (component.category === "Bearing") {
    base.unshift({ date: "2026-01-20", action: "Replaced grease seal", technician: "Devan Kumar" });
  }
  if (component.category === "Motor") {
    base.unshift({ date: "2026-02-11", action: "Winding insulation test — passed", technician: "Noor Fathima" });
  }
  return base;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

const EQUIPMENT_STATE_UPDATE_MS = 5 * 60 * 1000;

/* -------------------------------- Health scoring -------------------------------- */
// For each sensor, distance past the baseline band edge is normalized against
// the band's own width so a wide-tolerance sensor (RPM) and a tight one
// (vibration) contribute comparably. Health is 100 minus the worst offender,
// weighted so any single critical sensor can't be diluted by healthy ones.
function scoreReading(value, [lo, hi]) {
  const width = Math.max(hi - lo, 1);
  if (value < lo) return clamp(((lo - value) / width) * 100, 0, 140);
  if (value > hi) return clamp(((value - hi) / width) * 100, 0, 140);
  return 0;
}

function severityFromHealth(health) {
  if (health >= 80) return SEVERITY.HEALTHY;
  if (health >= 50) return SEVERITY.WARNING;
  return SEVERITY.CRITICAL;
}

function riskFromHealth(health, severity) {
  if (severity === SEVERITY.CRITICAL) return "Critical";
  if (severity === SEVERITY.WARNING) return health < 60 ? "High" : "Medium";
  return "Low";
}

function confidenceFromHealth(health, worstDelta, severity) {
  const base = severity === SEVERITY.HEALTHY ? 72 : severity === SEVERITY.WARNING ? 68 : 75;
  const clarity = clamp(worstDelta * 0.35, 0, 18);
  const separation = clamp((100 - health) * 0.12, 0, 12);
  return Math.round(clamp(base + clarity + separation, 55, 98));
}

function etaHoursFromHealth(health, severity, worstDelta) {
  if (severity === SEVERITY.HEALTHY) return null;
  if (severity === SEVERITY.WARNING) {
    const drift = clamp((80 - health) * 0.6 + worstDelta * 0.25, 0, 72);
    return Math.round(clamp(24 + drift, 24, 96));
  }
  const drift = clamp((60 - health) * 0.4 + Math.max(worstDelta - 15, 0) * 0.3, 0, 34);
  return Math.round(clamp(6 + drift, 6, 48));
}

function deriveComponentHealth(component, values) {
  let worst = 0;
  let worstSensor = null;
  let worstDelta = 0;
  for (const key of component.sensors) {
    const s = scoreReading(values[key], component.baseline[key]);
    if (s > worst) {
      worst = s;
      worstSensor = key;
      worstDelta = s;
    }
  }
  const health = clamp(100 - worst, 0, 100);
  return { health: Math.round(health), severity: severityFromHealth(health), worstSensor, worstDelta };
}

const SENSOR_ACTIONS = {
  temperature: "Inspect temperature-sensitive systems and verify cooling flow. If the temperature is above the normal band, check for stuck valves, blocked vents, or lubrication issues.",
  vibration: "Inspect rotating assemblies and alignment. Vibration above threshold typically indicates imbalance, bearing wear, or shaft misalignment.",
  pressure: "Verify pressure stability and look for blockages or leaks. High pressure can indicate pump restrictions; low pressure may indicate leakage or lost prime.",
  current: "Monitor electrical load and motor current. High current usually points to mechanical binding, bearing wear, or an electrical fault.",
  flow: "Confirm flow path integrity and valve operation. Low flow often means clogging, pump degradation, or partial valve closure.",
  noise: "Listen for abnormal acoustic patterns. Elevated noise often signals impact, looseness, or mechanical wear in rotating equipment.",
};

function initialDatasetReadings() {
  const record = HYDRAULIC_DATASET_SAMPLE_CYCLES[0];
  const rawReadings = buildHydraulicReadingsFromRecord(record, ALL_COMPONENTS);
  return Object.fromEntries(
    ALL_COMPONENTS.map((component) => {
      const values = rawReadings[component.id]?.values ?? Object.fromEntries(component.sensors.map((sensor) => [sensor, component.baseline[sensor]?.[0] ?? 0]));
      const { health, severity, worstSensor, worstDelta } = deriveComponentHealth(component, values);
      return [component.id, { values, health, severity, worstSensor, worstDelta, updatedAt: Date.now(), recordCycle: record.cycle }];
    })
  );
}

function buildDiagnosis(component, reading) {
  const cause = reading.worstSensor
    ? ROOT_CAUSES[reading.worstSensor]
    : "All monitored sensors are within the normal operating band.";
  const confidence = confidenceFromHealth(reading.health, reading.worstDelta || 0, reading.severity);
  const etaHours = etaHoursFromHealth(reading.health, reading.severity, reading.worstDelta || 0);
  const riskLevel = riskFromHealth(reading.health, reading.severity);
  const recommendedAction = reading.worstSensor
    ? SENSOR_ACTIONS[reading.worstSensor]
    : RECOMMENDED_ACTION[reading.severity];

  return {
    rootCause: cause,
    confidence,
    recommendedAction,
    etaToFailureHours: etaHours,
    riskLevel,
    repairTimeHours: REPAIR_TIME_HOURS[component.category] || 2,
    maintenanceHistory: seededHistory(component),
  };
}

/* -------------------------------- Work order helpers -------------------------------- */
let woSeq = 1000;

// Twin colour is driven by the active work order once one exists, per spec:
// Open/Assigned/Accepted -> critical (red), In Progress/Waiting for
// Parts/Testing -> warning (amber), Resolved/Closed -> healthy (green).
export function severityForWorkOrderStatus(status) {
  if (["Open", "Assigned", "Accepted"].includes(status)) return SEVERITY.CRITICAL;
  if (["In Progress", "Waiting for Parts", "Testing"].includes(status)) return SEVERITY.WARNING;
  return SEVERITY.HEALTHY; // Resolved, Closed
}

function slaHoursForPriority(priority) {
  return { Critical: 4, High: 12, Medium: 48, Low: 120 }[priority] ?? 48;
}

export const useDigitalTwinStore = create((set, get) => ({
  readings: initialDatasetReadings(),
  selectedId: null,
  cameraFocusRequest: null, // set on select, consumed by the scene's camera rig
  workOrders: [],
  role: "Plant Manager", // demo role switcher — see src/lib/rbac.js for the real-auth seam
  simTimer: null,
  datasetRecords: HYDRAULIC_DATASET_SAMPLE_CYCLES,
  datasetSampleCount: HYDRAULIC_DATASET_SAMPLE_CYCLES.length,
  datasetSampleIndex: 0,
  datasetSampleRecord: HYDRAULIC_DATASET_SAMPLE_CYCLES[0],
  datasetMetadata: HYDRAULIC_DATASET_METADATA,

  loadHydraulicDataset(records) {
    const cleaned = loadHydraulicDatasetRecords(records);
    set({
      datasetRecords: cleaned.length ? cleaned : HYDRAULIC_DATASET_SAMPLE_CYCLES,
      datasetSampleCount: cleaned.length ? cleaned.length : HYDRAULIC_DATASET_SAMPLE_CYCLES.length,
      datasetSampleIndex: 0,
    });
    get().loadDatasetRecord(0);
  },

  nextDatasetRecord() {
    const nextIndex = (get().datasetSampleIndex + 1) % get().datasetSampleCount;
    get().loadDatasetRecord(nextIndex);
  },

  prevDatasetRecord() {
    const count = get().datasetSampleCount;
    const prevIndex = (get().datasetSampleIndex - 1 + count) % count;
    get().loadDatasetRecord(prevIndex);
  },

  /* ---- sensor simulation ---- */
  randomizeEquipmentState() {
    const nextReadings = Object.fromEntries(
      ALL_COMPONENTS.map((component) => {
        const current = get().readings[component.id] ?? {
          values: Object.fromEntries(component.sensors.map((sensor) => [sensor, component.baseline[sensor]?.[0] ?? 0])),
        };

        const values = {};
        for (const sensor of component.sensors) {
          const band = component.baseline[sensor] ?? [0, 1];
          const low = band[0];
          const high = band[1];
          const spread = Math.max(high - low, 1);
          const baselineValue = current.values[sensor] ?? low;
          const noise = (Math.random() - 0.5) * spread * 0.9;
          const degradationBias = component.drift > 0 ? component.drift * spread * (Math.random() * 1.6 - 0.2) : 0;
          const nextValue = clamp(Number((baselineValue + noise + degradationBias).toFixed(1)), low * 0.65, high * 1.75);
          values[sensor] = nextValue;
        }

        const { health, severity, worstSensor, worstDelta } = deriveComponentHealth(component, values);
        return [
          component.id,
          {
            values,
            health,
            severity,
            worstSensor,
            worstDelta,
            updatedAt: Date.now(),
            recordCycle: get().datasetSampleRecord?.cycle ?? 0,
          },
        ];
      })
    );

    set({ readings: { ...get().readings, ...nextReadings } });
  },

  startSimulation() {
    if (get().simTimer) return;
    const timer = setInterval(() => get().randomizeEquipmentState(), EQUIPMENT_STATE_UPDATE_MS);
    set({ simTimer: timer });
  },
  stopSimulation() {
    const timer = get().simTimer;
    if (timer) clearInterval(timer);
    set({ simTimer: null });
  },
  tickSensors() {
    get().randomizeEquipmentState();
  },

  loadDatasetRecord(index) {
    const records = get().datasetRecords;
    const idx = records.length ? index % records.length : 0;
    const record = records[idx];
    const rawReadings = buildHydraulicReadingsFromRecord(record, ALL_COMPONENTS);
    const readings = Object.fromEntries(
      ALL_COMPONENTS.map((component) => {
        const values = rawReadings[component.id]?.values ?? Object.fromEntries(component.sensors.map((sensor) => [sensor, component.baseline[sensor]?.[0] ?? 0]));
        const { health, severity, worstSensor, worstDelta } = deriveComponentHealth(component, values);
        return [
          component.id,
          {
            values,
            health,
            severity,
            worstSensor,
            worstDelta,
            updatedAt: Date.now(),
            recordCycle: record.cycle,
          },
        ];
      })
    );
    set({
      readings,
      datasetSampleIndex: idx,
      datasetSampleRecord: record,
    });
  },

  /* ---- derived getters ---- */
  getReading(componentId) {
    return get().readings[componentId];
  },
  getComponent(componentId) {
    return COMPONENT_BY_ID[componentId];
  },
  getEffectiveSeverity(componentId) {
    const wo = get().getActiveWorkOrder(componentId);
    if (wo) return severityForWorkOrderStatus(wo.status);
    return get().readings[componentId]?.severity || SEVERITY.HEALTHY;
  },
  getActiveWorkOrder(componentId) {
    const orders = get()
      .workOrders.filter((w) => w.componentId === componentId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return orders.find((w) => w.status !== "Closed") || null;
  },
  getDiagnosis(componentId) {
    const component = COMPONENT_BY_ID[componentId];
    const reading = get().readings[componentId];
    if (!component || !reading) return null;
    return buildDiagnosis(component, reading);
  },

  /* ---- selection / camera focus ---- */
  selectComponent(componentId) {
    set({ selectedId: componentId, cameraFocusRequest: { id: componentId, ts: Date.now() } });
  },
  clearSelection() {
    set({ selectedId: null, cameraFocusRequest: null });
  },

  /* ---- work orders ---- */
  createWorkOrder({ componentId, priority = "Medium", assignedTo = null, dueDate = null, spareParts = [], notes = "", source = "Staff" }) {
    const component = COMPONENT_BY_ID[componentId];
    const reading = get().readings[componentId];
    const diagnosis = buildDiagnosis(component, reading);
    const sourceLabel = source === "PulseAI" ? "PulseAI" : "Staff";
    const id = `WO-${++woSeq}`;
    const now = Date.now();
    const queueAssignee = sourceLabel === "PulseAI" ? "PulseAI" : assignedTo ? TECHNICIANS.find((t) => t.id === assignedTo)?.name || "Unassigned" : "Unassigned";
    const order = {
      id,
      componentId,
      componentName: component.name,
      title: `${component.name}: ${diagnosis.rootCause.split(",")[0]}`,
      priority,
      status: sourceLabel === "PulseAI" ? "Open" : assignedTo ? "Assigned" : "Open",
      assignedTo,
      assignee: queueAssignee,
      responsibleTechnician: assignedTo ? TECHNICIANS.find((t) => t.id === assignedTo)?.name || "Unassigned" : "Unassigned",
      dueDate,
      spareParts,
      slaHours: slaHoursForPriority(priority),
      createdAt: now,
      createdBy: sourceLabel === "PulseAI" ? "PulseAI" : get().role,
      source: sourceLabel,
      sourceLabel: sourceLabel === "PulseAI" ? "PulseAI Auto-Assigned" : "Staff Assigned",
      originatingAlert: notes || diagnosis.rootCause,
      diagnosisSnapshot: diagnosis,
      comments: notes ? [{ id: `${id}-c1`, author: sourceLabel === "PulseAI" ? "PulseAI" : get().role, text: notes, ts: now }] : [],
      timeline: [{ status: sourceLabel === "PulseAI" ? "Open" : assignedTo ? "Assigned" : "Open", ts: now, by: sourceLabel === "PulseAI" ? "PulseAI" : get().role }],
    };
    set({ workOrders: [order, ...get().workOrders] });

    useFleetStore.getState().addAssignmentAlert({
      workOrderId: id,
      machineName: component.name,
      priority,
      dueDate,
      source: sourceLabel,
      sourceLabel: order.sourceLabel,
      createdAt: now,
      machineId: componentId,
      assignedTo,
      responsibleTechnician: order.responsibleTechnician,
      originatingAlert: order.originatingAlert,
    });

    return order;
  },

  createPulseAICriticalWorkOrder({ componentId, priority = "Critical", notes = "" }) {
    const component = COMPONENT_BY_ID[componentId];
    const reading = get().readings[componentId];
    if (!component || !reading) return null;

    const diagnosis = buildDiagnosis(component, reading);
    const summary = notes || `PulseAI detected a critical condition on ${component.name}: ${diagnosis.rootCause}`;
    return get().createWorkOrder({
      componentId,
      priority,
      assignedTo: null,
      dueDate: null,
      spareParts: [],
      notes: summary,
      source: "PulseAI",
    });
  },

  assignWorkOrder(workOrderId, { assignedTo, priority, dueDate, spareParts }) {
    const nextState = get().workOrders.map((w) => {
      if (w.id !== workOrderId) return w;
      const nextAssignedTo = assignedTo ?? w.assignedTo;
      const nextResponsibleTechnician = nextAssignedTo ? TECHNICIANS.find((t) => t.id === nextAssignedTo)?.name || "Unassigned" : "Unassigned";
      const status = w.status === "Open" ? "Assigned" : w.status;
      return {
        ...w,
        assignedTo: nextAssignedTo,
        assignee: w.source === "PulseAI" ? "PulseAI" : nextResponsibleTechnician,
        responsibleTechnician: nextResponsibleTechnician,
        priority: priority ?? w.priority,
        dueDate: dueDate ?? w.dueDate,
        spareParts: spareParts ?? w.spareParts,
        slaHours: priority ? slaHoursForPriority(priority) : w.slaHours,
        status,
        timeline: [...w.timeline, { status, ts: Date.now(), by: get().role }],
      };
    });

    set({ workOrders: nextState });

    const updated = nextState.find((w) => w.id === workOrderId);
    if (updated && updated.assignedTo) {
      useFleetStore.getState().addAssignmentAlert({
        workOrderId: updated.id,
        machineName: updated.componentName,
        priority: updated.priority,
        dueDate: updated.dueDate,
        source: updated.source || "Staff",
        sourceLabel: updated.source === "PulseAI" ? "PulseAI Auto-Assigned" : "Staff Assigned",
        createdAt: Date.now(),
        machineId: updated.componentId,
        assignedTo: updated.assignedTo,
        responsibleTechnician: updated.responsibleTechnician,
        originatingAlert: updated.originatingAlert || "Manual work order request",
      });
    }
  },

  updateWorkOrderStatus(workOrderId, status, note) {
    const now = Date.now();
    set({
      workOrders: get().workOrders.map((w) => {
        if (w.id !== workOrderId) return w;
        const comments = note ? [...w.comments, { id: `${w.id}-c${w.comments.length + 1}`, author: get().role, text: note, ts: now }] : w.comments;
        return { ...w, status, timeline: [...w.timeline, { status, ts: now, by: get().role }], comments };
      }),
    });
  },

  addComment(workOrderId, text) {
    if (!text.trim()) return;
    const now = Date.now();
    set({
      workOrders: get().workOrders.map((w) =>
        w.id === workOrderId
          ? { ...w, comments: [...w.comments, { id: `${w.id}-c${w.comments.length + 1}`, author: get().role, text, ts: now }] }
          : w
      ),
    });
  },

  /* ---- demo role switcher (see src/lib/rbac.js) ---- */
  setRole(role) {
    set({ role });
  },
}));

export { COMPONENTS as DIGITAL_TWIN_COMPONENTS };
