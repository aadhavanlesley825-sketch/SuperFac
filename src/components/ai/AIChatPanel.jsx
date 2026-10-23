import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { GlassCard } from "../theme/GlassCard.jsx";
import { useAIChat } from "../../hooks/useAIChat.js";
import { useFleetStore } from "../../lib/stores/fleetStore.js";
import { useDigitalTwinStore } from "../../lib/stores/digitalTwinStore.js";

const DEFAULT_SUGGESTIONS = [
  "Summarize current alerts",
  "List active critical machines",
  "Recommend maintenance actions",
  "Compare this machine to fleet average",
  "Navigate to the Alerts page",
];

const PAGE_TITLES = {
  "/overview": "Overview",
  "/machines": "Machines",
  "/digital-twin": "Digital Twin",
  "/alerts": "Alerts",
  "/maintenance": "Maintenance",
  "/reports": "Reports",
  "/settings": "Settings",
};

function pageLabelForPath(pathname) {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/machines/")) return "Machine Detail";
  if (pathname.startsWith("/maintenance/")) return "Work Order Detail";
  if (pathname.startsWith("/alerts/")) return "Alert Detail";
  return "SuperFac";
}

export default function AIChatPanel() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isTyping, error, send, reset } = useAIChat({
    welcomeText: "SuperFac Copilot is ready to help. Issue a command or ask for recommendations.",
  });

  const alerts = useFleetStore((s) => s.alerts);
  const machines = useFleetStore((s) => s.machines);
  const workOrders = useDigitalTwinStore((s) => s.workOrders);
  const selectedId = useDigitalTwinStore((s) => s.selectedId);
  const selectedComponent = useMemo(
    () => (selectedId ? useDigitalTwinStore.getState().getComponent(selectedId) : null),
    [selectedId]
  );

  const pageName = useMemo(() => pageLabelForPath(location.pathname), [location.pathname]);
  const alertCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.acknowledged).length;
  const openWorkOrders = workOrders.filter((w) => w.status !== "Closed" && w.status !== "Resolved").length;

  const context = useMemo(
    () => ({ currentPage: pageName, path: location.pathname, machines, alerts, openWorkOrders, selectedComponent }),
    [pageName, location.pathname, machines, alerts, openWorkOrders, selectedComponent]
  );

  useEffect(() => {
    if (!isOpen) return;
    const welcome = `You are on the ${pageName} page. ${alertCount} alerts are open, including ${criticalCount} critical and ${warningCount} warnings.`;
    if (messages.length === 1 && messages[0].text.startsWith("SuperFac Copilot is ready")) {
      send({ input: welcome, context });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const suggested = useMemo(() => {
    if (pageName === "Digital Twin") {
      return ["Explain the current twin status", "Show unhealthy components", "Recommend maintenance actions"];
    }
    if (pageName === "Alerts") {
      return ["Summarize today's alerts", "Which alerts are critical?", "Recommend next actions"];
    }
    if (pageName === "Maintenance") {
      return ["Which work orders need priority?", "Recommend next work orders", "Summarize maintenance backlog"];
    }
    return DEFAULT_SUGGESTIONS;
  }, [pageName]);

  const handleSuggestion = (text) => send({ input: text, context });

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="relative flex flex-col items-end gap-3">
        {isOpen && (
          <GlassCard className="w-[min(92vw,380px)] max-h-[560px] overflow-hidden border border-slate-200 shadow-[0_24px_52px_-28px_rgba(15,23,42,0.28)]" hover={false}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Bot size={19} />
                </div>
                <div>
                  <div className="text-[0.62rem] font-semibold tracking-[0.14em] text-amber-700 uppercase">Assistant</div>
                  <div className="text-sm font-semibold text-slate-900">SuperFac Copilot</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[0.68rem] font-medium text-slate-600 hover:border-amber-200 hover:text-slate-900"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 text-[0.76rem] text-slate-600">
              {pageName} · {alertCount} alerts · {openWorkOrders} open work orders
            </div>

            <div className="h-[300px] space-y-3 overflow-y-auto bg-slate-50 px-4 pb-4 pt-2">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No messages yet.</div>
              ) : (
                messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-amber-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[72%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-600" />
                      Thinking...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggested.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestion(item)}
                    className="rounded-full border border-slate-200 px-2.5 py-1.5 text-[0.68rem] font-medium text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const inputValue = form.elements.chatInput?.value?.trim();
                  if (!inputValue) return;
                  send({ input: inputValue, context });
                  form.reset();
                }}
                className="flex gap-2"
              >
                <input
                  name="chatInput"
                  type="text"
                  aria-label="Assistant message"
                  placeholder="Ask the assistant..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isTyping}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </GlassCard>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle SuperFac Copilot"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_18px_36px_-18px_rgba(180,83,9,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-16px_rgba(180,83,9,0.9)]"
        >
          <Sparkles size={22} />
        </button>
      </div>
    </div>
  );
}
