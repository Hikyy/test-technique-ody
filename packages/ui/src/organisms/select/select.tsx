"use client";

import { Select as BaseSelect } from "@base-ui-components/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/cn";

// TODO: verify Base UI <Select> API

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof BaseSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-[8px] border border-line-mid bg-surface px-3 py-2 text-[13.5px] text-ink",
      "focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <BaseSelect.Icon>
      <ChevronDown className="size-4 text-ink-3" />
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof BaseSelect.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Popup>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner sideOffset={4}>
      <BaseSelect.Popup
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-card border border-line bg-surface text-ink shadow-lg",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          "transition-opacity duration-150",
          className,
        )}
        {...props}
      >
        <BaseSelect.ScrollUpArrow className="flex h-6 cursor-default items-center justify-center text-ink-3">
          <ChevronUp className="size-4" />
        </BaseSelect.ScrollUpArrow>
        <div className="p-1">{children}</div>
        <BaseSelect.ScrollDownArrow className="flex h-6 cursor-default items-center justify-center text-ink-3">
          <ChevronDown className="size-4" />
        </BaseSelect.ScrollDownArrow>
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof BaseSelect.Item>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Item>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-[6px] py-1.5 pl-7 pr-2 text-[13px] text-ink outline-none",
      "data-[highlighted]:bg-accent-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <BaseSelect.ItemIndicator>
        <Check className="size-3.5 text-accent" />
      </BaseSelect.ItemIndicator>
    </span>
    <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
  </BaseSelect.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectGroupLabel = React.forwardRef<
  React.ElementRef<typeof BaseSelect.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof BaseSelect.GroupLabel>
>(({ className, ...props }, ref) => (
  <BaseSelect.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-[11px] uppercase tracking-[0.04em] text-ink-3", className)}
    {...props}
  />
));
SelectGroupLabel.displayName = "SelectGroupLabel";

type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof BaseSelect.Separator>;

export const SelectSeparator: React.ForwardRefExoticComponent<
  SelectSeparatorProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(({ className, ...props }, ref) => (
  <BaseSelect.Separator ref={ref} className={cn("my-1 h-px bg-line", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";
