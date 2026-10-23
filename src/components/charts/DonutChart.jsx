import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = ["#3FD0EA", "#F0A93B", "#5FD9AE", "#F1717A", "#7C8A99"];

export function DonutChart({ data, height = 180 }) {
  return (
    <div className="flex w-full flex-col items-center" style={{ minHeight: 0 }}>
      <div className="w-full max-w-[220px]" style={{ height: Math.min(height, 180) }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={1}
              cx="50%"
              cy="50%"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, "Share"]}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                color: "#0f172a",
                fontSize: 12,
                boxShadow: "0 12px 28px -18px rgba(15,23,42,0.3)",
                padding: "8px 10px",
              }}
              itemStyle={{ color: "#0f172a" }}
              labelStyle={{ color: "#0f172a" }}
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[0.72rem] text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{d.name}</span>
            <span className="font-semibold text-slate-700">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DonutChart;
