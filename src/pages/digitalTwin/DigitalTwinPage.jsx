import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Wrench, ChevronLeft, ChevronRight, Database } from "lucide-react";
import { TONE, GlassCard, Eyebrow } from "../../app/pulseplant-theme.jsx";
import MachineScene3D from "../../components/digitalTwin/MachineScene3D.jsx";
import DiagnosticsPanel from "./DiagnosticsPanel.jsx";
import {
  useDigitalTwinStore,
  FACILITY_CONTEXT,
  FACILITY_DEPARTMENTS,
  FACILITY_MACHINE_COMPONENTS,
} from "../../lib/stores/digitalTwinStore.js";

const SEVERITY_TONE = { healthy: "mint", warning: "amber", critical: "rose" };

function ComponentListRow({ component, severity, health, selected, onClick }) {
  const tone = TONE[SEVERITY_TONE[severity]];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
        selected ? "bg-slate-100 border border-slate-200" : "hover:bg-slate-50"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: tone.text, boxShadow: `0 0 6px ${tone.text}` }}
      />
      <span className="flex-1 min-w-0">
        <span className="block text-xs text-slate-700 truncate">{component.name}</span>
        <span className="block text-[0.62rem] text-slate-500">{component.category}</span>
      </span>
      <span className="text-xs font-semibold" style={{ color: tone.text }}>
        {health}%
      </span>
    </button>
  );
}

export default function DigitalTwinPage() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState("all");
  const fileInputRef = useRef(null);
  const facility = FACILITY_CONTEXT;
  const startSimulation = useDigitalTwinStore((s) => s.startSimulation);
  const stopSimulation = useDigitalTwinStore((s) => s.stopSimulation);
  const readings = useDigitalTwinStore((s) => s.readings);
  const selectedId = useDigitalTwinStore((s) => s.selectedId);
  const cameraFocusRequest = useDigitalTwinStore((s) => s.cameraFocusRequest);
  const selectComponent = useDigitalTwinStore((s) => s.selectComponent);
  const getEffectiveSeverity = useDigitalTwinStore((s) => s.getEffectiveSeverity);
  const workOrders = useDigitalTwinStore((s) => s.workOrders);
  const nextDatasetRecord = useDigitalTwinStore((s) => s.nextDatasetRecord);
  const prevDatasetRecord = useDigitalTwinStore((s) => s.prevDatasetRecord);
  const datasetSampleIndex = useDigitalTwinStore((s) => s.datasetSampleIndex);
  const datasetSampleCount = useDigitalTwinStore((s) => s.datasetSampleCount);
  const sampleRecord = useDigitalTwinStore((s) => s.datasetSampleRecord);
  const datasetMetadata = useDigitalTwinStore((s) => s.datasetMetadata);
  const loadHydraulicDataset = useDigitalTwinStore((s) => s.loadHydraulicDataset);

  const handleDatasetFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        loadHydraulicDataset(json);
      } catch (error) {
        console.error(error);
        alert("Unable to load dataset file. Please provide valid JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  useEffect(() => {
    startSimulation();
    return () => stopSimulation();
  }, [startSimulation, stopSimulation]);

  const DEPARTMENT_PARTS = {
    all: FACILITY_MACHINE_COMPONENTS.map((c) => c.id),
    moulding: ["moulding-press"],
    trimming: ["trimming-machine"],
    conveyor: ["conveyor-system"],
  };

  const visibleComponentIds = DEPARTMENT_PARTS[department] || DEPARTMENT_PARTS.all;
  const visibleComponents = FACILITY_MACHINE_COMPONENTS.filter((c) => visibleComponentIds.includes(c.id));
  const selectedComponent = selectedId ? FACILITY_MACHINE_COMPONENTS.find((c) => c.id === selectedId) : null;

  const visibleCount = visibleComponents.length;

  const severities = Object.fromEntries(
    visibleComponents.map((c) => [c.id, getEffectiveSeverity(c.id)])
  );
  const criticalCount = Object.values(severities).filter((s) => s === "critical").length;
  const warningCount = Object.values(severities).filter((s) => s === "warning").length;
  const openWorkOrders = workOrders.filter(
    (w) => w.status !== "Closed" && w.status !== "Resolved"
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-[#dfe4ea] bg-[#f7f7f5] p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="button"
                className="inline-flex items-center gap-2 h-11 rounded-lg border border-[#dfe4ea] bg-white px-3 text-sm font-medium text-[#111111] shadow-none"
              >
                <Database size={15} />
                <span>Dataset playback</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => prevDatasetRecord()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#dfe4ea] bg-white text-[#111111] hover:bg-[#f3f2f0]"
                  aria-label="Previous record"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => nextDatasetRecord()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#dfe4ea] bg-white text-[#111111] hover:bg-[#f3f2f0]"
                  aria-label="Next record"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <span className="text-sm text-[#4d4a47] whitespace-nowrap">
                Record {datasetSampleIndex + 1} / {datasetSampleCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 h-11 rounded-lg border border-[#dfe4ea] bg-white px-3 text-sm font-medium text-[#111111] hover:bg-[#f3f2f0]"
            >
              <Database size={15} />
              <span>Load dataset JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleDatasetFile}
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-11 min-w-[220px] max-w-full rounded-lg border border-[#dfe4ea] bg-white px-3 text-sm text-[#111111] outline-none focus:border-[#111111]"
            >
              {FACILITY_DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label}</option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium"
                style={{ background: TONE.rose.soft, color: TONE.rose.text, borderColor: "rgba(170, 58, 58, 0.18)" }}
              >
                {criticalCount} critical
              </span>
              <span
                className="inline-flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium"
                style={{ background: TONE.amber.soft, color: TONE.amber.text, borderColor: "rgba(168, 112, 39, 0.2)" }}
              >
                {warningCount} warning
              </span>
              <button
                type="button"
                onClick={() => navigate("/work-orders")}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dfe4ea] bg-white px-3 text-sm font-medium text-[#111111] hover:bg-[#f3f2f0]"
              >
                <Wrench size={13} />
                <span>{openWorkOrders} open work orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white/80 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.06em] text-slate-900 truncate">
            {selectedComponent?.name ?? facility.lineName}
          </h1>
          {selectedComponent && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {selectedComponent.zone}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{facility.region}</span>
          <span className="text-slate-400">•</span>
          <span>Facility: {facility.plantName}</span>
          <span className="text-slate-400">•</span>
          <span>{facility.cellName}</span>
          <span className="text-slate-400">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-800">
            {selectedComponent ? (getEffectiveSeverity(selectedComponent.id) ?? "Warning") : "Warning state"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-sky-700">
            SIMULATED DATA
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {visibleCount} machines in view
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-3 max-w-3xl">
          {facility.summary}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Live dataset sample: <span className="text-slate-900">{datasetMetadata.name}</span> · Cycle <span className="font-semibold">{sampleRecord?.cycle ?? "—"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1.45fr)_360px]">
        <div className="min-w-0">
          <GlassCard className="h-full p-4 md:p-5" hover={false}>
            <Eyebrow icon={Layers} tone="cyan">Components</Eyebrow>
            <div className="mt-3 space-y-1.5">
              {visibleComponents.map((c) => (
                <ComponentListRow
                  key={c.id}
                  component={c}
                  severity={severities[c.id]}
                  health={readings[c.id]?.health ?? 100}
                  selected={selectedId === c.id}
                  onClick={() => selectComponent(c.id)}
                />
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="min-w-0">
          <MachineScene3D
            components={visibleComponents}
            severities={severities}
            selectedId={selectedId}
            onSelect={selectComponent}
            focusRequest={
              cameraFocusRequest
                ? {
                    ...cameraFocusRequest,
                    camera: useDigitalTwinStore
                      .getState()
                      .getComponent(cameraFocusRequest.id)?.camera,
                  }
                : null
            }
          />
        </div>

        <div className="min-w-0">
          <DiagnosticsPanel
            componentId={selectedId}
            onOpenWorkOrder={(id) => navigate(`/work-orders?open=${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
