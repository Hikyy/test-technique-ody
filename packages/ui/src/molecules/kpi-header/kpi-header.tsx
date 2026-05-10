import { cn } from "../../lib/cn";

export interface KpiHeaderProps {
  label: string;
  delta?: string;
  deltaPos?: boolean;
  className?: string;
}

export function KpiHeader({ label, delta, deltaPos = true, className }: KpiHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-[11.5px] uppercase tracking-[0.04em] text-ink-2">{label}</span>
      {delta && (
        <span
          className={cn("font-mono text-[11px]", deltaPos ? "text-pos" : "text-neg")}
          aria-label={`Variation ${deltaPos ? "positive" : "négative"} ${delta}`}
        >
          {deltaPos ? "↑" : "↓"} {delta}
        </span>
      )}
    </div>
  );
}
