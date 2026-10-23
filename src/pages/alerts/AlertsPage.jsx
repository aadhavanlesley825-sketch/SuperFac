import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";
import { AlertFeed } from "../../features/alerts/components/AlertFeed.jsx";
import { useFleetStore } from "../../lib/stores/fleetStore.js";

export default function AlertsPage() {
  const alerts = useFleetStore((s) => s.alerts);
  const acknowledgeAlert = useFleetStore((s) => s.acknowledgeAlert);
  const [showAcked, setShowAcked] = useState(true);

  const visible = showAcked ? alerts : alerts.filter((a) => !a.acknowledged);

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <div className="text-[0.7rem] font-semibold tracking-widest text-amber-700 uppercase mb-1">Predictive alerts</div>
        <h1 className="text-2xl font-semibold text-slate-900">Alerts</h1>
        <p className="text-sm text-slate-600 mt-1">
          {alerts.filter((a) => !a.acknowledged).length} unacknowledged of {alerts.length} total.
        </p>
      </div>

      <GlassCard className="p-4 mb-4" hover={false}>
        <label className="flex items-center gap-2 text-xs text-slate-700 px-2">
          <input type="checkbox" checked={showAcked} onChange={(e) => setShowAcked(e.target.checked)} />
          Show acknowledged alerts
        </label>
      </GlassCard>

      <AlertFeed alerts={visible} onAcknowledge={acknowledgeAlert} />
    </div>
  );
}
