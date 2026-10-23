import React, { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { GlassCard } from "../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../components/theme/Eyebrow.jsx";

/* ------------------------------------------------------------------ */
/*  FleetCopilotChat                                                    */
/*                                                                      */
/*  Ported from the HTML's #copilot chat panel — a rule-based responder  */
/*  over fleet-wide data (which the per-component DiagnosticsPanel does   */
/*  NOT cover; that one only answers for a single selected component).    */
/*  Purely presentational + local state: reads `machines`/`alerts` as     */
/*  props, doesn't touch fleetStore itself.                               */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "Which machine needs attention first?",
  "What's the Chennai plant average health?",
  "Show me the most common failure mode",
  "Which plant has the most alerts?",
];

function buildAnswer(question, machines, alerts) {
  const q = question.toLowerCase();
  const worst = [...machines].sort((a, b) => a.healthScore - b.healthScore)[0];
  const unacked = alerts.filter((a) => !a.acknowledged);

  if (q.includes("attention") || q.includes("worst") || q.includes("first")) {
    return `${worst.name} at ${worst.plant} needs attention first — health ${worst.healthScore}%, ${worst.status}, estimated ${worst.rulDays} days before ${worst.failureMode.toLowerCase()} becomes likely.`;
  }
  if (q.includes("average") || q.includes("avg")) {
    const avg = Math.round(machines.reduce((s, m) => s + m.healthScore, 0) / machines.length);
    return `Chennai plant average health is ${avg}% across ${machines.length} monitored assets.`;
  }
  if (q.includes("failure mode") || q.includes("common")) {
    const counts = {};
    machines.forEach((m) => (counts[m.failureMode] = (counts[m.failureMode] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `${top[0]} is the most common failure mode right now, affecting ${top[1]} asset${top[1] === 1 ? "" : "s"}.`;
  }
  if (q.includes("plant") || q.includes("alerts")) {
    const counts = {};
    alerts.forEach((a) => (counts[a.plant] = (counts[a.plant] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]} has the most alerts right now: ${top[1]} raised.` : "No alerts raised yet.";
  }
  if (q.includes("critical")) {
    const critical = machines.filter((m) => m.status === "critical");
    return critical.length
      ? `${critical.length} machine${critical.length === 1 ? " is" : "s are"} critical: ${critical.map((m) => m.name).join(", ")}.`
      : "No machines are currently critical.";
  }
  return `${unacked.length} unacknowledged alert${unacked.length === 1 ? "" : "s"} across the fleet. Ask about a specific plant, failure mode, or which machine needs attention first.`;
}

export default function FleetCopilotChat({ machines, alerts }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Fleet copilot online. Ask about any plant, machine, or failure mode." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const ask = (question) => {
    if (!question.trim()) return;
    const answer = buildAnswer(question, machines, alerts);
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "ai", text: answer }]);
    setInput("");
  };

  return (
    <GlassCard className="p-0 h-full flex flex-col overflow-hidden" hover={false}>
      <div className="px-5 pt-5 pb-1">
        <Eyebrow icon={Bot} tone="cyan">AI copilot</Eyebrow>
        <h3 className="text-base font-semibold text-slate-900">Fleet Copilot</h3>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2" style={{ minHeight: 160, maxHeight: 260 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed rounded-xl px-3 py-2 max-w-[88%] ${m.role === "user" ? "self-end" : "self-start"}`}
            style={{
              background: m.role === "user" ? "rgba(37,99,235,0.08)" : "rgba(148,163,184,0.08)",
              color: "#0f172a",
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 pb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="text-[0.65rem] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex gap-2 px-5 py-3 border-t border-white/[0.06]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a plant, machine, or failure mode…"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-200"
        >
          <Send size={13} />
        </button>
      </form>
    </GlassCard>
  );
}
