import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[7px] px-2 py-[3px] text-[11.5px] font-medium font-sans whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-ink",
        accent: "bg-accent-tint text-accent",
        pos: "bg-pos/10 text-pos",
        neg: "bg-neg/10 text-neg",
        warn: "bg-warn-soft text-warn",
        outline: "border border-line-mid text-ink-2",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
