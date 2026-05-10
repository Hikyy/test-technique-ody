import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-medium select-none",
    "rounded-[8px] transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-bg hover:bg-accent/90 active:bg-accent/95 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        ghost: "bg-transparent text-ink hover:bg-accent-soft active:bg-accent-tint",
        outline: "border border-line-mid bg-surface text-ink hover:bg-accent-soft hover:border-line-strong",
        destructive: "bg-neg text-bg hover:bg-neg/90 active:bg-neg/95",
        link: "text-accent underline-offset-4 hover:underline px-0",
        ink: "bg-ink text-bg hover:bg-ink/90",
      },
      size: {
        sm: "h-8 px-3 text-[12.5px]",
        default: "h-[34px] px-[14px] text-[13px]",
        lg: "h-10 px-5 text-sm",
        icon: "h-[34px] w-[34px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  render?: (props: React.ComponentPropsWithRef<"button">) => React.ReactElement;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, ...props }, ref) => {
    const merged = {
      ref,
      className: cn(buttonVariants({ variant, size }), className),
      ...props,
    } as React.ComponentPropsWithRef<"button">;
    if (render) return render(merged);
    return <button {...merged} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
