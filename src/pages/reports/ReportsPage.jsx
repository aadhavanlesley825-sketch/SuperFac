import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, ShieldCheck } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { KpiCard } from "../../components/ui/KpiCard.jsx";
import { DonutChart } from "../../components/charts/DonutChart.jsx";
import { BarChart } from "../../components/charts/BarChart.jsx";
import { FLEET_HEALTH_DISTRIBUTION, FAILURE_MODE_BREAKDOWN } from "../../lib/mock/machines.js";

const MTBF_TREND = [
  { month: "Feb", mtbf: 34 }, { month: "Mar", mtbf: 37 }, { month: "Apr", mtbf: 39 },
  { month: "May", mtbf: 41 }, { month: "Jun", mtbf: 44 }, { month: "Jul", mtbf: 46 },
];

export default function ReportsPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">Analytics</div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600 mt-1">Reliability trends and cost-avoidance across the fleet.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <KpiCard index={0} icon={TrendingUp} tone="mint" label="MTBF Trend" staticValue="46 days" sub="+35% over 6 months" delta="+6d" deltaGood />
        <KpiCard index={1} icon={ShieldCheck} tone="cyan" label="Downtime Avoided" staticValue="128 hrs" sub="Estimated this quarter" delta="+18h" deltaGood />
        <KpiCard index={2} icon={BarChart3} tone="amber" label="Cost Avoidance" staticValue="₹18.4L" sub="vs. run-to-failure baseline" delta="This quarter" deltaGood />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        <div className="xl:col-span-7">
          <GlassCard className="p-6 h-full">
            <Eyebrow icon={TrendingUp} tone="mint">Reliability</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-4">MTBF, last 6 months</h3>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={MTBF_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "#5C6875", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5C6875", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(16,20,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                  <Line type="monotone" dataKey="mtbf" stroke="#5FD9AE" strokeWidth={2.4} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
        <div className="xl:col-span-5">
          <GlassCard className="p-6 h-full">
            <Eyebrow icon={BarChart3} tone="cyan">Fleet composition</Eyebrow>
            <h3 className="text-base font-semibold text-slate-900 mb-2">Health distribution</h3>
            <DonutChart data={FLEET_HEALTH_DISTRIBUTION} />
          </GlassCard>
        </div>
      </div>

      <GlassCard className="p-6">
        <Eyebrow icon={BarChart3} tone="amber">Failure analysis</Eyebrow>
        <h3 className="text-base font-semibold text-slate-900 mb-4">Failure modes, fleet-wide</h3>
        <BarChart data={FAILURE_MODE_BREAKDOWN} height={260} />
      </GlassCard>
    </div>
  );
}
