import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, ShieldCheck, TrendingDown, Clock3, Database, ArrowUpRight } from "lucide-react";
import { KpiCard } from "../../components/ui/KpiCard.jsx";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { DonutChart } from "../../components/charts/DonutChart.jsx";
import { BarChart } from "../../components/charts/BarChart.jsx";
import MachineTwin from "../../features/digital-twin/components/MachineTwin.jsx";
import { DetectionTimeline } from "../../features/predictions/components/DetectionTimeline.jsx";
import { AlertFeed } from "../../features/alerts/components/AlertFeed.jsx";
import FactoryFloorMap from "../../features/fleet/FactoryFloorMap.jsx";
import CriticalAlertModal from "../../features/fleet/CriticalAlertModal.jsx";
import { useFleetStore } from "../../lib/stores/fleetStore.js";
import { FLEET_HEALTH_DISTRIBUTION, FAILURE_MODE_BREAKDOWN } from "../../lib/mock/machines.js";
import { DETECTION_TIMELINE } from "../../lib/mock/alerts.js";

export default function OverviewPage() {
  const machines = useFleetStore((s) => s.machines);
  const alerts = useFleetStore((s) => s.alerts);
  const acknowledgeAlert = useFleetStore((s) => s.acknowledgeAlert);
  const startFleetSim = useFleetStore((s) => s.startFleetSim);
  const stopFleetSim = useFleetStore((s) => s.stopFleetSim);

  // Live fleet-health drift + critical-alert generation, mirroring how
  // DigitalTwinPage starts/stops its own simulation on mount/unmount.
  useEffect(() => {
    startFleetSim();
    return () => stopFleetSim();
  }, [startFleetSim, stopFleetSim]);

  const focusMachine = useMemo(
    () => [...machines].sort((a, b) => a.healthScore - b.healthScore)[0],
    [machines]
  );

  const plantName = "Nike Chennai Manufacturing Facility";
  const avgHealth = machines.length ? Math.round(machines.reduce((s, m) => s + m.healthScore, 0) / machines.length) : 0;
  const predicted7d = machines.filter((m) => m.status !== "healthy" && m.rulDays <= 21).length;
  const mtbfDays = 46;
  const downtimeAvoidedHrs = 128;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Fixed overlay — pops up whenever a machine trips into "critical",
          seeded on load or minted later by the live sim. No layout impact. */}
      <CriticalAlertModal />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="mb-8">
          <div className="editorial-kicker mb-3">Command center</div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <h1 className="editorial-heading text-[#111111]">
              Today&apos;s shifts
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e2dfdb] bg-white px-3 py-1.5 text-xs font-medium text-[#3d3a37]">
              <span className="h-2 w-2 rounded-full bg-[#111111]" />
              2 interventions trending this week
            </div>
          </div>
          <p className="text-base text-[#4d4a47] mt-4 max-w-3xl">
            {plantName} is currently operating at {avgHealth}% plant health with {predicted7d} assets projected for intervention within 21 days.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-6 mb-6">
          <div className="xl:col-span-3">
            <KpiCard index={0} icon={Gauge} tone="cyan" label="Plant Health Score"
              value={avgHealth} format={(v) => `${Math.round(v)}%`}
              sub={`Weighted across ${machines.length} monitored assets at ${plantName}`} delta="+2.1%" deltaGood />
          </div>
          <div className="xl:col-span-3">
            <KpiCard index={1} icon={TrendingDown} tone="rose" label="Predicted Failures (7d)"
              value={predicted7d} format={(v) => Math.round(v)}
              sub={`Assets at ${plantName} with RUL under 21 days`} delta={`${predicted7d} active`} deltaGood={false} />
          </div>
          <div className="xl:col-span-3">
            <KpiCard index={2} icon={Clock3} tone="mint" label="Mean Time Between Failures"
              staticValue={`${mtbfDays} days`}
              sub="Rolling 90-day plant average" delta="+6d vs. last qtr" deltaGood />
          </div>
          <div className="xl:col-span-3">
            <KpiCard index={3} icon={ShieldCheck} tone="amber" label="Downtime Avoided"
              value={downtimeAvoidedHrs} format={(v) => `${Math.round(v)}h`}
              sub="Estimated vs. run-to-failure baseline" delta="This quarter" deltaGood />
          </div>
        </div>

        {/* Main grid: digital twin + timeline / alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          <div className="xl:col-span-7 flex flex-col gap-6">
            <MachineTwin machine={focusMachine} />
            <AlertFeed alerts={alerts} limit={4} onAcknowledge={acknowledgeAlert} />
          </div>
          <div className="xl:col-span-5">
            <DetectionTimeline events={DETECTION_TIMELINE} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 items-start">
          <div className="xl:col-span-6">
            <FactoryFloorMap machines={machines} />
          </div>
          <div className="xl:col-span-6">
            <GlassCard className="p-4 md:p-5 w-full max-h-[360px]">
              <Eyebrow icon={Gauge} tone="mint">Fleet composition</Eyebrow>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Health distribution</h3>
              <div className="flex justify-center">
                <DonutChart data={FLEET_HEALTH_DISTRIBUTION} />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-8 items-stretch">
          <div className="xl:col-span-12 flex flex-col">
            <GlassCard className="p-6 flex-1">
              <Eyebrow icon={TrendingDown} tone="amber">Failure analysis</Eyebrow>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Top predicted failure modes</h3>
              <BarChart data={FAILURE_MODE_BREAKDOWN} />
            </GlassCard>
          </div>
        </div>

        <div className="pb-10">
          <GlassCard className="p-5 md:p-6 border border-[#e9dcc8] bg-[#f7f3ee]/95">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2d2ba] bg-[#f1e5d6] text-[#b85f1e] shadow-sm">
                <Database size={18} />
              </div>
              <div className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#b85f1e]">Dataset source</div>
            </div>

            <p className="text-[1.1rem] md:text-[1.45rem] leading-relaxed tracking-[-0.04em] text-slate-800">
              The dataset source for this project is the AI4I 2020 Predictive Maintenance Dataset from the UCI Machine Learning Repository.
            </p>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
