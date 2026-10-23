import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * columns: [{ key, label, render?(row), sortable?, width? }]
 * rows: array of objects, each needs a stable `id`
 */
export function DataTable({ columns, rows, onRowClick, activeId, emptyLabel = "No records." }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
    return copy;
  }, [rows, sort]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir * -1 } : { key, dir: 1 }));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#e4e1dd]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-2.5 px-3 text-[0.68rem] uppercase tracking-[0.14em] text-[#5a5754] font-semibold select-none"
                style={{ width: col.width, cursor: col.sortable ? "pointer" : "default" }}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sort.key === col.key && (
                    sort.dir === 1 ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-[#5a5754]">
                {emptyLabel}
              </td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick && onRowClick(row)}
              className="border-b border-[#ece9e5] hover:bg-[#f7f6f4] transition-colors"
              style={{
                cursor: onRowClick ? "pointer" : "default",
                background: activeId === row.id ? "#f7f6f4" : undefined,
              }}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 px-3 text-sm text-[#111111]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
