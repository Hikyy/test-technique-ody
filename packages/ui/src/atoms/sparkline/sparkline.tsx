export interface SparklineProps {
  pts: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: string | null;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  pts,
  w = 110,
  h = 26,
  color = "var(--color-accent)",
  fill = "var(--color-accent-tint)",
  strokeWidth = 1.4,
  className,
}: SparklineProps) {
  if (!pts.length) return null;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const r = max - min || 1;
  const xs = pts.map<[number, number]>((p, i) => [(i / (pts.length - 1 || 1)) * w, h - ((p - min) / r) * (h - 4) - 2]);
  const d = xs.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} className={className} style={{ display: "block" }} aria-hidden>
      {fill && <path d={`${d} L${w},${h} L0,${h} Z`} fill={fill} />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
