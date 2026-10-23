import React, { useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  Factory,
  AlertTriangle,
  Wrench,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  Cpu,
} from "lucide-react";

import { useFleetStore } from "../lib/stores/fleetStore.js";
import { useToasts } from "./providers.jsx";
import { ToastStack } from "../components/ui/ToastStack.jsx";
import AuthHeaderControls from "../auth/AuthHeaderControls.jsx";
import AIChatPanel from "../components/ai/AIChatPanel.jsx";
import CriticalAlertModal from "../features/fleet/CriticalAlertModal.jsx";

const NAV = [
  { to: "/overview", label: "Overview", icon: Activity },
  { to: "/machines", label: "Machines", icon: Factory },
  { to: "/digital-twin", label: "Digital Twin", icon: Cpu },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const alerts = useFleetStore((s) => s.alerts);
  const { toasts, pushToast, dismissToast } = useToasts();

  const fired = useRef(false);
  const activeCritical = alerts.filter(
    (a) => a.severity === "critical" && !a.acknowledged
  );
  const showNotifications = React.useCallback(() => {
    if (activeCritical.length > 0) {
      const summary = activeCritical.length > 1
        ? `${activeCritical.length} critical issues need attention.`
        : `${activeCritical[0].machine}: ${activeCritical[0].message}`;
      pushToast({ title: "Active alerts", desc: summary });
    } else {
      pushToast({ title: "No new alerts", desc: "All systems are operating normally." });
    }
  }, [activeCritical, pushToast]);

  useEffect(() => {
    if (fired.current || activeCritical.length === 0) return;

    fired.current = true;

    const a = activeCritical[0];

    const t = setTimeout(() => {
      pushToast({
        title: "Predictive alert",
        desc: `${a.machine}: ${a.message}`,
      });
    }, 1800);

    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#f5f5f3] text-[#111111]">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <CriticalAlertModal />

      <div className="flex flex-col md:flex-row flex-1 min-w-0">
        <aside className="w-full md:w-[220px] md:flex-shrink-0 border-b md:border-b-0 md:border-r border-[#e4e1dd] bg-[#ffffff] flex flex-col py-5 px-3">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-[#f5f5f3] border border-[#e4e1dd] flex items-center justify-center overflow-hidden p-0.5">
              <img src={`${import.meta.env.BASE_URL}superfac-logo.svg`} alt="SuperFac logo" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="text-sm font-semibold text-[#111111] leading-none">SuperFac</div>
              <div className="text-[0.62rem] text-[#6d6965] mt-1 tracking-[0.14em] uppercase">Predict. Prevent. Perform.</div>
            </div>
          </div>

          <nav className="flex flex-col md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#111111] text-white"
                      : "text-[#4d4a47] hover:text-[#111111] hover:bg-[#f3f2f0]"
                  }`
                }
              >
                <item.icon size={15} />

                {item.label}

                {item.to === "/alerts" && activeCritical.length > 0 && (
                  <span className="ml-auto inline-flex min-w-[18px] justify-center rounded-full bg-[#111111] px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                    {activeCritical.length}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-[#e4e1dd] pt-4">
            <button
              type="button"
              onClick={showNotifications}
              className="flex w-full items-center justify-between rounded-md border border-[#e4e1dd] bg-[#ffffff] px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f2f0]"
            >
              <span className="flex items-center gap-2">
                <Bell size={14} />
                Alerts
              </span>
              {activeCritical.length > 0 ? (
                <span className="rounded-full bg-[#111111] px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                  {activeCritical.length}
                </span>
              ) : (
                <span className="text-[0.62rem] text-[#6d6965]">Live</span>
              )}
            </button>

            <div className="rounded-md border border-[#e4e1dd] bg-[#f9f9f7] p-2">
              <AuthHeaderControls />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto p-4 md:p-7">
            <div className="max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-[#1f1f1f] bg-[#111111] text-white px-5 py-4 md:px-8">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 p-1">
                  <img src={`${import.meta.env.BASE_URL}superfac-logo.svg`} alt="SuperFac logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-sm font-medium tracking-[-0.02em] text-white">Nike Chennai Manufacturing Facility</div>
              </div>
              <div className="text-[0.72rem] text-white/70">SuperFac · predictive maintenance command center</div>
            </div>
          </footer>
        </div>
      </div>

      <AIChatPanel />
    </div>
  );
}

export default AppShell;