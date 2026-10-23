import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Send, X, MessageSquare } from "lucide-react";
import { GlassCard } from "./theme/GlassCard.jsx";
import { Eyebrow } from "./theme/Eyebrow.jsx";
import { useFleetStore } from "../lib/stores/fleetStore.js";
import { useDigitalTwinStore, DIGITAL_TWIN_COMPONENTS } from "../lib/stores/digitalTwinStore.js";

const AGENT_SUGGESTIONS = [
  "Open the Digital Twin page",
  "Show me active critical alerts",
  "Navigate to Alerts",
  "List open work orders",
  "Summarize fleet health",
];

function buildAgentResponse({ command, machines, alerts, openWorkOrders, componentStatuses, navigate }) {
  const q = command.trim().toLowerCase();
  if (!q) return "I am ready to act. Tell me a fleet, twin, alert, or maintenance task to execute.";

  const routes = [
    { label: "overview", path: "/overview" },
    { label: "digital twin", path: "/digital-twin" },
    { label: "alerts", path: "/alerts" },
    { label: "maintenance", path: "/maintenance" },
    { label: "reports", path: "/reports" },
    { label: "settings", path: "/settings" },
  ];

  for (const route of routes) {
    if (q.includes(route.label) && (q.includes("open") || q.includes("go to") || q.includes("show") || q.includes("navigate") || q.includes("launch"))) {
      navigate(route.path);
      return `Executing navigation to the ${route.label} page.`;
    }
  }

  if (q.includes("urgent") || q.includes("critical") || q.includes("alerts")) {
    const critical = alerts.filter((a) => a.severity === "critical" && !a.acknowledged);
    const warning = alerts.filter((a) => a.severity === "warning" && !a.acknowledged);
    if (critical.length > 0) {
      return `There are ${critical.length} active critical alerts. The most recent: ${critical[0].machine} — ${critical[0].message}.`;
    }
    if (warning.length > 0) {
      return `There are ${warning.length} warnings waiting. Example: ${warning[0].machine} — ${warning[0].message}.`;
    }
    return "No active alerts at the moment. Everything looks stable.";
  }

  if (q.includes("fleet average") || q.includes("average health") || q.includes("health average")) {
    const avg = machines.length ? Math.round(machines.reduce((sum, item) => sum + item.healthScore, 0) / machines.length) : 0;
    return `Chennai plant average health is ${avg}% across ${machines.length} monitored machines.`;
  }

  if (q.includes("work order") || q.includes("work orders")) {
    return `There are ${openWorkOrders} open work orders in the system. I can take you to the maintenance page if you want.`;
  }

  if (q.includes("machine needs attention") || q.includes("attention first") || q.includes("worst machine")) {
    const worst = [...machines].sort((a, b) => a.healthScore - b.healthScore)[0];
    if (worst) {
      return `${worst.name} at ${worst.plant} is the highest priority asset right now at ${worst.healthScore}% health, status ${worst.status}.`;
    }
    return "I don't have machine health data right now.";
  }

  if (q.includes("digital twin") || q.includes("component") || q.includes("twin")) {
    const faults = componentStatuses.filter((c) => c.severity !== "healthy");
    if (faults.length) {
      return `Current twin status: ${faults.length} part${faults.length === 1 ? " is" : "s are"} degraded. Top items: ${faults.slice(0, 3).map((f) => `${f.name} (${f.severity})`).join(", ")}.`;
    }
    return "All monitored twin components are healthy right now.";
  }

  if (q.includes("help") || q.includes("what can you do") || q.includes("capabilities")) {
    return "I can answer fleet and digital twin health questions, summarize alerts, tell you open work order counts, and navigate you to Overview, Digital Twin, Alerts, Maintenance, Reports, or Settings.";
  }

  return `I can help with alerts, fleet health, work orders, components, or page navigation. Try asking something like \"Show me the most urgent alerts\".`;
}

export default function AgenticChat({ visible, onClose }) {
  const navigate = useNavigate();
  const alerts = useFleetStore((s) => s.alerts);
  const machines = useFleetStore((s) => s.machines);
  const workOrders = useDigitalTwinStore((s) => s.workOrders);
  const getEffectiveSeverity = useDigitalTwinStore((s) => s.getEffectiveSeverity);

  const [messages, setMessages] = useState([
    { role: "ai", text: "Agent ready. Issue a command and I will execute it across fleet, twin, alert, or maintenance workflows." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  const componentStatuses = useMemo(
    () => DIGITAL_TWIN_COMPONENTS.map((component) => ({
      id: component.id,
      name: component.name,
      category: component.category,
      severity: getEffectiveSeverity(component.id),
    })),
    [getEffectiveSeverity]
  );

  const openWorkOrders = useMemo(() => workOrders.filter((w) => w.status !== "Closed" && w.status !== "Resolved").length, [workOrders]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const execute = (command) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    const userMessage = { role: "user", text: trimmed };
    const answer = buildAgentResponse({ command: trimmed, machines, alerts, openWorkOrders, componentStatuses, navigate });
    setMessages((prev) => [...prev, userMessage, { role: "ai", text: answer }]);
    setInput("");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none sm:p-6">
      <div className="pointer-events-auto w-full max-w-[420px]">
        <GlassCard className="flex flex-col h-[520px] overflow-hidden" hover={false}>
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                <Bot size={20} />
              </div>
              <div>
                <Eyebrow icon={MessageSquare} tone="cyan">Agentic AI</Eyebrow>
                <div className="text-sm font-semibold text-slate-900">Autonomous command agent</div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 bg-slate-100">
              <X size={16} />
            </button>
          </div>

          <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`rounded-2xl px-3 py-2 max-w-[88%] ${message.role === "user" ? "ml-auto bg-blue-50 text-blue-900" : "bg-white text-slate-700 border border-slate-200"}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 px-5 py-3 bg-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {AGENT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => execute(suggestion)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); execute(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell the agent what to do..."
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              />
              <button type="submit" className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500">
                <Send size={16} />
              </button>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
