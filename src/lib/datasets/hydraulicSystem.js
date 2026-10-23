export const HYDRAULIC_DATASET_METADATA = {
  name: "Condition Monitoring of Hydraulic Systems",
  source: "UCI Machine Learning Repository",
  url: "https://archive.ics.uci.edu/datasets/Condition+Monitoring+of+Hydraulic+Systems",
  downloadUrl: "https://archive.ics.uci.edu/static/public/447/condition+monitoring+of+hydraulic+systems.zip",
  doi: "10.24432/C5CW21",
  license: "CC BY 4.0",
  description:
    "Sensor readings from a hydraulic test rig, including pressures, temperatures, flow, power and vibration for predictive maintenance.",
  instances: 2205,
  features: 43680,
  targetLabels: [
    "cooler condition",
    "valve condition",
    "internal pump leakage",
    "accumulator pressure",
    "stable flag",
  ],
};

export const HYDRAULIC_DATASET_FIELD_NAMES = [
  "PS1",
  "PS2",
  "PS3",
  "PS4",
  "PS5",
  "PS6",
  "EPS1",
  "FS1",
  "FS2",
  "TS1",
  "TS2",
  "TS3",
  "TS4",
  "VS1",
  "CE",
  "CP",
  "SE",
];

export const HYDRAULIC_DATASET_SAMPLE_CYCLES = [
  {
    cycle: 21,
    PS1: 32.6,
    PS2: 24.1,
    PS3: 28.7,
    PS4: 31.2,
    PS5: 27.9,
    PS6: 26.3,
    EPS1: 892.1,
    FS1: 19.8,
    FS2: 23.5,
    TS1: 48.6,
    TS2: 52.0,
    TS3: 49.2,
    TS4: 51.4,
    VS1: 2.9,
    CE: 88.4,
    CP: 11.7,
    SE: 93.9,
  },
  {
    cycle: 42,
    PS1: 35.9,
    PS2: 25.8,
    PS3: 30.1,
    PS4: 32.9,
    PS5: 29.4,
    PS6: 28.0,
    EPS1: 912.3,
    FS1: 21.2,
    FS2: 25.1,
    TS1: 49.8,
    TS2: 53.6,
    TS3: 50.5,
    TS4: 52.7,
    VS1: 3.2,
    CE: 87.1,
    CP: 12.1,
    SE: 92.8,
  },
  {
    cycle: 63,
    PS1: 41.7,
    PS2: 29.3,
    PS3: 33.8,
    PS4: 35.5,
    PS5: 32.0,
    PS6: 30.6,
    EPS1: 948.7,
    FS1: 24.7,
    FS2: 28.9,
    TS1: 53.1,
    TS2: 56.2,
    TS3: 53.9,
    TS4: 55.5,
    VS1: 4.1,
    CE: 84.8,
    CP: 12.9,
    SE: 90.4,
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function format(value) {
  return Number(value.toFixed(2));
}

function pressureToComponentPressure(pressure) {
  return format(clamp(pressure / 10, 0.8, 5.5));
}

function vibrationFromVibrationSensor(value) {
  return format(clamp(value * 0.7, 0.5, 9.5));
}

function noiseFromVibrationSensor(value) {
  return format(clamp(48 + value * 4.2, 40, 90));
}

function currentFromPower(value) {
  return format(clamp(value * 0.0215, 0.5, 24));
}

function rpmFromPower(value) {
  return format(clamp(1420 + (value - 850) * 0.07, 1300, 1520));
}

function mapHydraulicRecordToComponentReadings(record, component) {
  switch (component.id) {
    case "motor":
      return {
        temperature: format(clamp(record.TS1 + 1.2, 20, 100)),
        vibration: vibrationFromVibrationSensor(record.VS1),
        current: currentFromPower(record.EPS1),
        noise: noiseFromVibrationSensor(record.VS1),
        rpm: rpmFromPower(record.EPS1),
      };
    case "gearbox":
      return {
        temperature: format(clamp(record.TS2 + 1.4, 20, 100)),
        vibration: format(clamp(vibrationFromVibrationSensor(record.VS1) * 0.92, 0.5, 9.0)),
        pressure: pressureToComponentPressure(record.PS3),
        noise: noiseFromVibrationSensor(record.VS1),
      };
    case "bearing-de":
      return {
        temperature: format(clamp(record.TS3, 20, 100)),
        vibration: format(clamp(vibrationFromVibrationSensor(record.VS1) * 0.9, 0.5, 8.5)),
        noise: format(clamp(noiseFromVibrationSensor(record.VS1) * 0.93, 44, 86)),
      };
    case "bearing-nde":
      return {
        temperature: format(clamp(record.TS4, 20, 100)),
        vibration: format(clamp(vibrationFromVibrationSensor(record.VS1) * 0.85, 0.5, 8.3)),
        noise: format(clamp(noiseFromVibrationSensor(record.VS1) * 0.9, 44, 85)),
      };
    case "roller-in":
      return {
        vibration: format(clamp(record.FS1 / 8, 0.4, 2.4)),
        noise: format(clamp(48 + record.FS1 * 0.6, 46, 68)),
      };
    case "roller-out":
      return {
        vibration: format(clamp(record.FS2 / 8, 0.4, 2.7)),
        noise: format(clamp(48 + record.FS2 * 0.55, 46, 66)),
      };
    case "sensor-array":
      return {
        temperature: format(clamp(record.TS1 * 0.96, 20, 60)),
        current: format(clamp(currentFromPower(record.EPS1) * 0.085, 0.2, 1.4)),
      };
    case "control-panel":
      return {
        temperature: format(clamp(record.TS4 * 0.86, 20, 60)),
        current: format(clamp(currentFromPower(record.EPS1) * 0.095, 0.3, 1.8)),
      };
    case "pump":
      return {
        temperature: format(clamp(record.TS1 + 2.4, 24, 88)),
        pressure: pressureToComponentPressure(record.PS2),
        vibration: vibrationFromVibrationSensor(record.VS1),
        current: currentFromPower(record.EPS1),
      };
    case "valve-bank":
      return {
        temperature: format(clamp(record.TS2 + 1.8, 24, 78)),
        pressure: pressureToComponentPressure(record.PS4),
        noise: noiseFromVibrationSensor(record.VS1),
      };
    case "cooler":
      return {
        temperature: format(clamp(record.TS4 * 0.82, 18, 52)),
        pressure: pressureToComponentPressure(record.PS5),
        flow: format(clamp(record.FS2 * 0.92, 10, 20)),
      };
    default:
      return Object.fromEntries(
        component.sensors.map((sensor) => [sensor, component.baseline[sensor]?.[0] ?? 0])
      );
  }
}

export function buildHydraulicReadingsFromRecord(record, components) {
  return Object.fromEntries(
    components.map((component) => {
      const values = mapHydraulicRecordToComponentReadings(record, component);
      return [component.id, { values, recordCycle: record.cycle }];
    })
  );
}

export function loadHydraulicDatasetRecords(records) {
  if (!Array.isArray(records)) return [];
  return records
    .map((record, index) => {
      const normalized = { cycle: record.cycle ?? index + 1 };
      for (const field of HYDRAULIC_DATASET_FIELD_NAMES) {
        const raw = record[field];
        const value = typeof raw === "string" ? Number(raw.replace(/,/g, "")) : raw;
        normalized[field] = Number.isFinite(value) ? value : 0;
      }
      return normalized;
    })
    .filter((record) =>
      HYDRAULIC_DATASET_FIELD_NAMES.some((field) => typeof record[field] === "number")
    );
}
