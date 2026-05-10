import type * as React from "react";
import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-8 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="text-ink-3 [&_svg]:size-7">{icon}</div>}
      <h3 className="font-serif text-[22px] italic text-ink">{title}</h3>
      {body && <p className="max-w-sm text-[13px] text-ink-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
