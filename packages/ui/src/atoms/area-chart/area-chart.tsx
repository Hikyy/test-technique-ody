export interface AreaChartProps {
  pts: number[];
  w: number;
  h: number;
  color?: string;
  gridY?: number;
  className?: string;
  gradientId?: string;
}

export function AreaChart({
  pts,
  w,
  h,
  color = "var(--color-accent)",
  gridY = 4,
  className,
  gradientId = "v11-area",
}: AreaChartProps) {
  if (!pts.length) return null;
  const rawMax = Math.max(...pts);
  const rawMin = Math.min(...pts);
  const max = rawMax;
  const min = rawMin - (rawMax - rawMin) * 0.1;
  const r = max - min || 1;

  const padTop = 16;
  const padBot = 22;
  const padL = 0;
  const padR = 0;
  const cw = w - padL - padR;
  const ch = h - padTop - padBot;

  const xs = pts.map<[number, number]>((p, i) => [
    padL + (i / (pts.length - 1 || 1)) * cw,
    padTop + (1 - (p - min) / r) * ch,
  ]);

  const d = xs.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const last = xs[xs.length - 1] ?? [0, 0];

  return (
    <svg width={w} height={h} className={className} style={{ display: "block" }} aria-hidden>
      {Array.from({ length: gridY }, (_, i) => {
        const y = padTop + (ch / Math.max(gridY - 1, 1)) * i;
        return <line key={`grid-${y}`} x1={0} x2={w} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" />;
      })}
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${last[0]},${padTop + ch} L${padL},${padTop + ch} Z`} fill={`url(#${gradientId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="var(--color-bg)" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
