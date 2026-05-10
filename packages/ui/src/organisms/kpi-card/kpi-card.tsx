import type * as React from "react";
import { Sparkline } from "../../atoms/sparkline/sparkline";
import { cn } from "../../lib/cn";
import { KpiHeader } from "../../molecules/kpi-header/kpi-header";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaPos?: boolean;
  points?: number[];
  className?: string;
}

export function KpiCard({ label, value, delta, deltaPos = true, points, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-card border border-line bg-surface",
        "pt-5 pb-[18px] px-[22px]",
        className,
      )}
    >
      <KpiHeader label={label} delta={delta} deltaPos={deltaPos} />
      <div className="mt-3.5 font-sans text-[36px] font-medium leading-none text-ink" style={{ letterSpacing: "-1px" }}>
        {value}
      </div>
      {points && points.length > 0 && (
        <div className="mt-3.5">
          <Sparkline pts={points} w={220} h={28} />
        </div>
      )}
    </div>
  );
}
