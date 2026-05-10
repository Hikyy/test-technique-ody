"use client";

import { Menu } from "@base-ui-components/react/menu";
import { Check, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/cn";

// TODO: verify Base UI <Menu> API

export const Dropdown = Menu.Root;
export const DropdownTrigger = Menu.Trigger;
export const DropdownPortal = Menu.Portal;
export const DropdownGroup = Menu.Group;
export const DropdownRadioGroup = Menu.RadioGroup;
export const DropdownSub = Menu.SubmenuRoot;

const itemBase =
  "relative flex cursor-default select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-ink outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent-soft data-[highlighted]:text-ink";

export const DropdownContent = React.forwardRef<
  React.ElementRef<typeof Menu.Popup>,
  React.ComponentPropsWithoutRef<typeof Menu.Popup> & { sideOffset?: number }
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Menu.Portal>
    <Menu.Positioner sideOffset={sideOffset}>
      <Menu.Popup
        ref={ref}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-card border border-line bg-surface p-1 shadow-lg",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          "transition-opacity duration-150",
          className,
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
));
DropdownContent.displayName = "DropdownContent";

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item>
>(({ className, ...props }, ref) => <Menu.Item ref={ref} className={cn(itemBase, className)} {...props} />);
DropdownItem.displayName = "DropdownItem";

export const DropdownCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Menu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Menu.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <Menu.CheckboxItem ref={ref} className={cn(itemBase, "pl-7", className)} {...props}>
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <Menu.CheckboxItemIndicator>
        <Check className="size-3.5 text-accent" />
      </Menu.CheckboxItemIndicator>
    </span>
    {children}
  </Menu.CheckboxItem>
));
DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

export const DropdownRadioItem = React.forwardRef<
  React.ElementRef<typeof Menu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Menu.RadioItem>
>(({ className, children, ...props }, ref) => (
  <Menu.RadioItem ref={ref} className={cn(itemBase, "pl-7", className)} {...props}>
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <Menu.RadioItemIndicator>
        <span className="size-2 rounded-full bg-accent" />
      </Menu.RadioItemIndicator>
    </span>
    {children}
  </Menu.RadioItem>
));
DropdownRadioItem.displayName = "DropdownRadioItem";

export const DropdownGroupLabel = React.forwardRef<
  React.ElementRef<typeof Menu.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof Menu.GroupLabel>
>(({ className, ...props }, ref) => (
  <Menu.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-[11px] uppercase tracking-[0.04em] text-ink-3", className)}
    {...props}
  />
));
DropdownGroupLabel.displayName = "DropdownGroupLabel";

type DropdownSeparatorProps = React.ComponentPropsWithoutRef<typeof Menu.Separator>;

export const DropdownSeparator: React.ForwardRefExoticComponent<
  DropdownSeparatorProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, DropdownSeparatorProps>(({ className, ...props }, ref) => (
  <Menu.Separator ref={ref} className={cn("my-1 h-px bg-line", className)} {...props} />
));
DropdownSeparator.displayName = "DropdownSeparator";

export const DropdownSubTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.SubmenuTrigger>,
  React.ComponentPropsWithoutRef<typeof Menu.SubmenuTrigger>
>(({ className, children, ...props }, ref) => (
  <Menu.SubmenuTrigger ref={ref} className={cn(itemBase, className)} {...props}>
    {children}
    <ChevronRight className="ml-auto size-4" />
  </Menu.SubmenuTrigger>
));
DropdownSubTrigger.displayName = "DropdownSubTrigger";
