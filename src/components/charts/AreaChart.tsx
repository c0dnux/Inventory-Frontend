import { useId } from "react";

interface Point {
  label: string;
  value: number;
}

export function AreaChart({
  data,
  height = 260,
  color = "#465fff",
}: {
  data: Point[];
  height?: number;
  color?: string;
}) {
  const gradientId = useId();
  if (data.length === 0) return null;

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = innerW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (d.value / max) * innerH,
    d,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${padding.top + innerH} L${points[0].x},${padding.top + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Area chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerH * f}
          y2={padding.top + innerH * f}
          className="stroke-slate-100 dark:stroke-gray-800"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={color}
          className="dark:stroke-gray-900"
          strokeWidth="1.5"
        />
      ))}

      {points.map((p, i) => (
        <text
          key={`l-${i}`}
          x={p.x}
          y={height - 6}
          textAnchor="middle"
          className="fill-slate-400 text-[10px] dark:fill-gray-500"
        >
          {p.d.label}
        </text>
      ))}
    </svg>
  );
}
