import { useMemo } from "react";

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────

function BarChart({ data, height = 120, barColor = "#4F7CFF", label = "" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div>
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      )}
      <svg viewBox={`0 0 100 ${height}`} className="w-full overflow-visible" style={{ height }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0" y1={height - f * height}
            x2="100" y2={height - f * height}
            stroke="rgba(148,163,184,0.15)" strokeWidth="0.5"
          />
        ))}
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 16);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - barH - 2;
          return (
            <g key={i}>
              {/* Bar background */}
              <rect
                x={x} y={4} width={w} height={height - 6}
                rx="2" fill="rgba(148,163,184,0.07)"
              />
              {/* Bar fill */}
              <rect
                x={x} y={y} width={w} height={Math.max(barH, 1)}
                rx="2.5"
                fill={barColor}
                opacity={d.value === 0 ? 0.25 : 0.9}
              />
              {/* Value label */}
              {d.value > 0 && (
                <text
                  x={x + w / 2} y={y - 3}
                  textAnchor="middle" fontSize="4" fill={barColor} fontWeight="bold"
                >
                  {d.value}
                </text>
              )}
              {/* Day label */}
              <text
                x={x + w / 2} y={height + 8}
                textAnchor="middle" fontSize="4.5" fill="rgba(148,163,184,0.7)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stacked Bar Chart ─────────────────────────────────────────────────────

function StackedBarChart({ data, height = 120, label = "" }) {
  const max = Math.max(...data.map((d) => (d.completed || 0) + (d.pending || 0)), 1);
  const barWidth = 100 / data.length;

  return (
    <div>
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 opacity-80" />
          <span className="text-[9px] text-slate-400">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 opacity-80" />
          <span className="text-[9px] text-slate-400">Pending</span>
        </div>
      </div>
      <svg viewBox={`0 0 100 ${height}`} className="w-full overflow-visible" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" y1={height - f * height} x2="100" y2={height - f * height}
            stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
        ))}
        {data.map((d, i) => {
          const total = (d.completed || 0) + (d.pending || 0);
          const compH = ((d.completed || 0) / max) * (height - 14);
          const pendH = ((d.pending || 0) / max) * (height - 14);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;

          return (
            <g key={i}>
              <rect x={x} y={4} width={w} height={height - 6} rx="2" fill="rgba(148,163,184,0.07)" />
              {/* Pending bar (bottom) */}
              {pendH > 0 && (
                <rect
                  x={x} y={height - pendH - 2} width={w} height={Math.max(pendH, 1)}
                  rx="2"
                  fill="#fbbf24" opacity="0.75"
                />
              )}
              {/* Completed bar (on top) */}
              {compH > 0 && (
                <rect
                  x={x} y={height - pendH - compH - 2} width={w} height={Math.max(compH, 1)}
                  rx="2"
                  fill="#10b981" opacity="0.85"
                />
              )}
              {total > 0 && (
                <text
                  x={x + w / 2} y={height - pendH - compH - 5}
                  textAnchor="middle" fontSize="4" fill="rgba(148,163,184,0.8)" fontWeight="bold"
                >{total}</text>
              )}
              <text
                x={x + w / 2} y={height + 8}
                textAnchor="middle" fontSize="4.5" fill="rgba(148,163,184,0.7)"
              >{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Line / Area Trend Chart ───────────────────────────────────────────────

function TrendChart({ data, height = 90, color = "#4F7CFF", label = "" }) {
  if (!data || data.length < 2) {
    return (
      <div>
        {label && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>}
        <div className="flex items-center justify-center h-20 text-xs text-slate-500">Not enough data</div>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 96 + 2;
    const y = height - 10 - ((d.value / max) * (height - 20));
    return { x, y, ...d };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${pts[0].x},${height - 4} ${pts.map((p) => `L${p.x},${p.y}`).join(" ")} L${pts[pts.length - 1].x},${height - 4} Z`;

  return (
    <div>
      {label && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>}
      <svg viewBox={`0 0 100 ${height}`} className="w-full overflow-visible" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="2" y1={height - 4 - f * (height - 20)} x2="98" y2={height - 4 - f * (height - 20)}
            stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.2" fill={color} opacity="0.9" />
            <circle cx={p.x} cy={p.y} r="3.5" fill={color} opacity="0.15" />
          </g>
        ))}
        {/* Labels */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={height + 7}
            textAnchor="middle" fontSize="4" fill="rgba(148,163,184,0.65)">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── BubbleAnalytics Main ──────────────────────────────────────────────────

/**
 * Props:
 *  tasks  — all tasks array
 *  theme  — "light" | "dark"
 *  view   — "daily" | "weekly" | "monthly"
 */
export default function BubbleAnalytics({ tasks, theme, view = "weekly" }) {
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50/80 border-slate-200";

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (view === "daily") {
      // Last 14 days
      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (13 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
        return {
          label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
          date: dateStr,
          completed: dayTasks.filter((t) => t.completed).length,
          pending: dayTasks.filter((t) => !t.completed).length,
          percentage: dayTasks.length
            ? Math.round((dayTasks.filter((t) => t.completed).length / dayTasks.length) * 100)
            : 0,
        };
      });
    }

    if (view === "weekly") {
      // Last 8 weeks
      return Array.from({ length: 8 }, (_, i) => {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekTasks = tasks.filter((t) => {
          if (!t.dueDate) return false;
          const td = new Date(t.dueDate);
          return td >= weekStart && td <= weekEnd;
        });
        return {
          label: `W${8 - i}`,
          completed: weekTasks.filter((t) => t.completed).length,
          pending: weekTasks.filter((t) => !t.completed).length,
          percentage: weekTasks.length
            ? Math.round((weekTasks.filter((t) => t.completed).length / weekTasks.length) * 100)
            : 0,
        };
      }).reverse();
    }

    // Monthly — last 6 months
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const monthStr = d.toISOString().slice(0, 7); // "YYYY-MM"
      const monthTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(monthStr));
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        completed: monthTasks.filter((t) => t.completed).length,
        pending: monthTasks.filter((t) => !t.completed).length,
        percentage: monthTasks.length
          ? Math.round((monthTasks.filter((t) => t.completed).length / monthTasks.length) * 100)
          : 0,
      };
    });
  }, [tasks, view]);

  const completedData = chartData.map((d) => ({ value: d.completed, label: d.label }));
  const percentageData = chartData.map((d) => ({ value: d.percentage, label: d.label }));

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-5 ${cardBg}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StackedBarChart
          data={chartData}
          height={110}
          label="Tasks Overview"
        />
        <TrendChart
          data={percentageData}
          height={110}
          color="#4F7CFF"
          label="Productivity % Trend"
        />
      </div>
      <BarChart
        data={completedData}
        height={90}
        barColor="#10b981"
        label="Completed Tasks"
      />
    </div>
  );
}
