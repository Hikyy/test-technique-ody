import { Badge } from "../../atoms/badge/badge";
import { cn } from "../../lib/cn";

export type OrderStatus = "pending" | "cooking" | "sent" | "served" | "cancelled";

const STATUS: Record<
  OrderStatus,
  { label: string; dot: string; variant: "default" | "accent" | "pos" | "neg" | "warn" }
> = {
  pending: { label: "En attente", dot: "bg-ink-2", variant: "default" },
  cooking: { label: "En cuisine", dot: "bg-warn", variant: "warn" },
  sent: { label: "Envoyé", dot: "bg-accent", variant: "accent" },
  served: { label: "Servi", dot: "bg-pos", variant: "pos" },
  cancelled: { label: "Annulé", dot: "bg-neg", variant: "neg" },
};

export interface StatusPillProps {
  status: OrderStatus;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const cfg = STATUS[status];
  return (
    <Badge variant={cfg.variant} className={cn("gap-2 py-1", className)}>
      <span className={cn("inline-block size-[7px] rounded-full", cfg.dot)} aria-hidden />
      {label ?? cfg.label}
    </Badge>
  );
}

export const STATUS_LABELS = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label])) as Record<
  OrderStatus,
  string
>;
