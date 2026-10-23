import { mulberry32, between } from "../utils/rng.js";

const rand = mulberry32(20260723);

export const CHENNAI_PLANT_NAME = "Nike Chennai Manufacturing Facility";
export const PLANTS = [CHENNAI_PLANT_NAME];
export const ASSET_TYPES = [
  { type: "Moulding Press", failureModes: ["Sole bonding drift", "Mould temperature imbalance", "Cavity pressure variation"] },
  { type: "Trimming Machine", failureModes: ["Blade wear", "Material drag", "Cut precision drift"] },
  { type: "Conveyor System", failureModes: ["Belt tracking drift", "Drive slip", "Alignment variance"] },
];

const HEALTH_BANDS = [
  { key: "healthy", min: 82, max: 99 },
  { key: "monitoring", min: 65, max: 81 },
  { key: "warning", min: 45, max: 64 },
  { key: "critical", min: 18, max: 44 },
];

// Was private to this module — exported (no other change) so fleetStore's
// live tick can classify a drifted healthScore the exact same way the
// original generation did, instead of re-implementing the bands elsewhere.
export function bandFor(score) {
  const match = HEALTH_BANDS.find((b) => score >= b.min && score <= b.max);
  if (match) return match.key;
  return score > HEALTH_BANDS[0].max ? "healthy" : "critical";
}

export function filterChennaiMachines(machines = MACHINES) {
  return machines.filter((machine) => machine.plant === CHENNAI_PLANT_NAME);
}

function genMachine(i) {
  const asset = ASSET_TYPES[i % ASSET_TYPES.length];
  const forcedScore = i === 0 ? 31 : i === 1 ? 61 : 88;
  const health = forcedScore ?? Math.round(between(rand, 40, 98));
  const status = bandFor(health);
  const failureMode = asset.failureModes[i % asset.failureModes.length];
  const rulDays = status === "critical" ? Math.round(between(rand, 2, 6))
    : status === "warning" ? Math.round(between(rand, 7, 21))
    : Math.round(between(rand, 40, 180));

  return {
    id: `M-${2000 + i}`,
    name: asset.type,
    type: asset.type,
    plant: CHENNAI_PLANT_NAME,
    line: "Sole Manufacturing Line 1",
    healthScore: health,
    status,
    failureMode,
    rulDays,
    vibrationMm_s: Number(between(rand, 1.2, status === "critical" ? 9.5 : status === "warning" ? 5.5 : 3.2).toFixed(2)),
    tempC: Number(between(rand, 42, status === "critical" ? 92 : 78).toFixed(1)),
    lastService: `${Math.round(between(rand, 8, 120))}d ago`,
    sensors: ["Vibration", "Temperature", "Acoustic", "Current draw"],
  };
}

export const MACHINES = Array.from({ length: 3 }, (_, i) => genMachine(i));

export function genTrend(machine, points = 24) {
  let base = machine.healthScore + 8;
  return Array.from({ length: points }, (_, i) => {
    base += between(rand, -1.2, machine.status === "critical" ? -1.6 : 0.6);
    return {
      t: `${String(i).padStart(2, "0")}:00`,
      health: Math.max(15, Math.min(99, Math.round(base))),
      vibration: Number((machine.vibrationMm_s + between(rand, -0.4, 0.4)).toFixed(2)),
    };
  });
}

export const FLEET_HEALTH_DISTRIBUTION = (() => {
  const chennaiMachines = filterChennaiMachines(MACHINES);
  const counts = { healthy: 0, monitoring: 0, warning: 0, critical: 0 };
  chennaiMachines.forEach((m) => (counts[m.status] += 1));
  const total = chennaiMachines.length || 1;
  return [
    { name: "Healthy", value: Math.round((counts.healthy / total) * 100) },
    { name: "Monitoring", value: Math.round((counts.monitoring / total) * 100) },
    { name: "Warning", value: Math.round((counts.warning / total) * 100) },
    { name: "Critical", value: Math.round((counts.critical / total) * 100) },
  ];
})();

export const FAILURE_MODE_BREAKDOWN = [
  { name: "Bearing wear", count: 31 },
  { name: "Lubrication breakdown", count: 22 },
  { name: "Vibration imbalance", count: 17 },
  { name: "Winding insulation breakdown", count: 11 },
  { name: "Seal leakage", count: 7 },
];
