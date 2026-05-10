import { cn } from "../../lib/cn";

export interface BarHItem {
  label: string;
  value: number;
  ratio?: number;
}

export interface BarHProps {
  items: BarHItem[];
  max?: number;
  barColor?: string;
  highlightFirst?: boolean;
  className?: string;
}

export function BarH({ items, max, barColor = "var(--color-accent)", highlightFirst = true, className }: BarHProps) {
  const computedMax = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((it, i) => {
        const ratio = it.ratio !== undefined ? it.ratio : Math.max(0, Math.min(1, it.value / computedMax));
        const fade = 0.35 + 0.4 * (1 - i / Math.max(items.length, 1));
        const fill = i === 0 ? barColor : `rgb(91 110 79 / ${fade.toFixed(2)})`;
        return (
          <div key={it.label} className="grid grid-cols-[1fr_36px] items-center gap-2.5 py-[5px]">
            <div>
              <div className="mb-1 flex justify-between text-[12.5px]">
                <span className={highlightFirst && i === 0 ? "font-serif italic text-[14px] text-ink" : "text-ink"}>
                  {it.label}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-accent-soft">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(ratio * 100).toFixed(1)}%`, background: fill }}
                />
              </div>
            </div>
            <div className="text-right font-mono text-[12px] text-ink-2">×{it.value}</div>
          </div>
        );
      })}
    </div>
  );
}
