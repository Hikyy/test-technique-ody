"use client";

import { Avatar as BaseAvatar } from "@base-ui-components/react/avatar";
import * as React from "react";
import { cn } from "../../lib/cn";

// TODO: verify Base UI <Avatar> API

export const Avatar = React.forwardRef<
  React.ElementRef<typeof BaseAvatar.Root>,
  React.ComponentPropsWithoutRef<typeof BaseAvatar.Root>
>(({ className, ...props }, ref) => (
  <BaseAvatar.Root
    ref={ref}
    className={cn(
      "relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-[#d8d3c4] align-middle",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof BaseAvatar.Image>,
  React.ComponentPropsWithoutRef<typeof BaseAvatar.Image>
>(({ className, ...props }, ref) => (
  <BaseAvatar.Image ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof BaseAvatar.Fallback>,
  React.ComponentPropsWithoutRef<typeof BaseAvatar.Fallback>
>(({ className, ...props }, ref) => (
  <BaseAvatar.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center text-[11px] font-medium text-ink", className)}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
