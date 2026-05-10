import type * as React from "react";
import { cn } from "../../lib/cn";

export interface DashboardTemplateProps {
  header: React.ReactNode;
  kpis: React.ReactNode;
  hero: React.ReactNode;
  rail?: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}

export function DashboardTemplate({ header, kpis, hero, rail, secondary, className }: DashboardTemplateProps) {
  return (
    <div className={cn("flex flex-col gap-[18px]", className)}>
      <div className="mb-2">{header}</div>

      {secondary && <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.55fr_1fr]">{secondary}</section>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{kpis}</section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <div>{hero}</div>
        {rail && <div className="flex flex-col gap-3.5">{rail}</div>}
      </section>
    </div>
  );
}
