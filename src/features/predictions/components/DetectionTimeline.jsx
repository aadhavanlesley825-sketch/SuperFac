import React from "react";
import { Radio, Search, Gauge, Wrench } from "lucide-react";
import { GlassCard } from "../../../components/theme/GlassCard.jsx";
import { Eyebrow } from "../../../components/theme/Eyebrow.jsx";
import { TONE } from "../../../components/theme/tokens.js";

const ICONS = { Radio, Search, Gauge, Wrench };

export function DetectionTimeline({ events }) {
  return (
    <GlassCard className="p-6">
      <Eyebrow icon={Radio} tone="cyan">Detect → Schedule</Eyebrow>
      <h3 className="text-base font-semibold text-slate-900 mb-4">How the prediction was made</h3>

      <div className="flex flex-col">
        {events.map((ev, i) => {
          const Icon = ICONS[ev.icon] || Radio;
          const t = TONE[ev.tone] || TONE.cyan;
          const last = i === events.length - 1;
          return (
            <div key={ev.stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.soft }}
                >
                  <Icon size={11} style={{ color: t.text }} />
                </div>
                {!last && <div className="w-[2px] flex-1 my-1" style={{ background: "rgba(255,255,255,0.09)" }} />}
              </div>
              <div className="pb-5">
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] font-semibold" style={{ color: t.text }}>{ev.stage}</span>
                  <span className="text-[0.68rem] text-slate-500">{ev.time}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{ev.title}</div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed max-w-[42ch]">{ev.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export default DetectionTimeline;
