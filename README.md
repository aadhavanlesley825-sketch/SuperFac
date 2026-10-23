# SuperFac — AI-Powered Predictive Maintenance & Digital Twin Platform

Enterprise React + Tailwind app for a hypothetical Nike Chennai manufacturing facility. Warm industrial control deck theme with glass panels, amber/cyan/rose/mint signal palette, and predictive-maintenance workflows.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
```

## Routes

| Path | Page |
|---|---|
| `/overview` | Command Center — fleet KPIs, digital twin, alert feed, detection timeline |
| `/machines` | Fleet Explorer — sortable/filterable asset table |
| `/machines/:machineId` | Machine Detail — twin, health trend, RUL, service history |
| `/alerts` | Predictive alert feed |
| `/alerts/:alertId` | Alert Detail — root-cause trace |
| `/maintenance` | Work order queue |
| `/maintenance/:workOrderId` | Work Order Detail |
| `/reports` | MTBF trend, downtime avoided, failure-mode breakdown |
| `/settings` | Detection thresholds, notifications, team access |

## Structure

```
src/
├── app/            AppShell, routes, providers
├── pages/          route-level screens, one folder per domain
├── features/       domain widgets (digital-twin, predictions, alerts)
├── components/
│   ├── theme/      GlassCard, Eyebrow, tokens.js — the shared design system
│   ├── ui/         KpiCard, DataTable, StatusPill, ToastStack, etc.
│   └── charts/     DonutChart, BarChart wrappers around Recharts
├── lib/
│   ├── mock/       seeded mock generators (machines, alerts, work orders)
│   ├── stores/     zustand fleetStore
│   └── utils/      rng.js
└── styles/         Tailwind entry + hand-rolled panel/keyframe CSS
```

## Swapping mock data for a real backend

Everything reads through `useFleetStore` (`src/lib/stores/fleetStore.js`) and
`src/lib/mock/*`. Replace the mock generators with real API/WebSocket calls
and the rest of the app — pages, widgets, routing — needs no changes, since
none of them import mock data directly.

## Digital twin

`src/features/digital-twin/components/MachineTwin.jsx` renders a live
health ring + oscilloscope-style vibration trace per asset. See the comment
at the top of that file for how to drop in a full react-three-fiber scene
per asset type (the original `Conveyor3D.jsx` you uploaded is kept under
`reference-legacy/` as a starting point for that).
