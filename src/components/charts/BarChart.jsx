import React, { useMemo } from "react";

export function BarChart({ data, dataKey = "count", nameKey = "name", height = 220, color = "#F0A93B" }) {
  const maxValue = useMemo(
    () => Math.max(...(data || []).map((item) => Number(item?.[dataKey] ?? 0)), 1),
    [data, dataKey]
  );

  return (
    <div className="w-full" style={{ minHeight: height }}>
      <div className="space-y-3">
        {data.map((item, index) => {
          const value = Number(item?.[dataKey] ?? 0);
          const width = `${(value / maxValue) * 100}%`;

          return (
            <div key={`${item?.[nameKey] ?? "item"}-${index}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 text-[0.68rem] font-semibold text-slate-500 text-right">{index + 1}</span>
                  <span className="truncate text-sm font-medium text-slate-700">{item?.[nameKey] ?? "Unknown"}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900">{value}</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width,
                    background: index === 0 ? "#2563eb" : index === 1 ? "#0ea5e9" : index === 2 ? "#f59e0b" : "#10b981",
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BarChart;
