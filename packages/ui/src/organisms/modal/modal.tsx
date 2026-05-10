"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/cn";

// TODO: verify Base UI <Dialog> API

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalPortal = Dialog.Portal;
export const ModalClose = Dialog.Close;

export const ModalBackdrop = React.forwardRef<
  React.ElementRef<typeof Dialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Dialog.Backdrop>
>(({ className, ...props }, ref) => (
  <Dialog.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]",
      "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
      "transition-opacity duration-150",
      className,
    )}
    {...props}
  />
));
ModalBackdrop.displayName = "ModalBackdrop";

export type ModalVariant = "center" | "side-rail";

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Popup> {
  variant?: ModalVariant;
  showClose?: boolean;
}

const variantClasses: Record<ModalVariant, string> = {
  center: [
    "left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
    "rounded-card border border-line shadow-2xl",
    "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
    "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
    "transition-[opacity,transform] duration-150",
  ].join(" "),
  "side-rail": [
    "right-0 top-0 h-full w-[420px] max-w-[90vw]",
    "border-l border-line shadow-xl",
    "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
    "transition-transform duration-200 ease-out",
  ].join(" "),
};

export const ModalContent = React.forwardRef<React.ElementRef<typeof Dialog.Popup>, ModalContentProps>(
  ({ className, children, variant = "center", showClose = true, ...props }, ref) => (
    <Dialog.Portal>
      <ModalBackdrop />
      <Dialog.Popup
        ref={ref}
        className={cn("fixed z-50 bg-surface text-ink p-6 outline-none", variantClasses[variant], className)}
        {...props}
      >
        {children}
        {showClose && (
          <Dialog.Close
            className="absolute right-4 top-4 rounded-sm text-ink-3 transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </Dialog.Close>
        )}
      </Dialog.Popup>
    </Dialog.Portal>
  ),
);
ModalContent.displayName = "ModalContent";

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 mb-4", className)} {...props} />
);

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
);

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title ref={ref} className={cn("font-serif text-[22px] italic text-ink", className)} {...props} />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description ref={ref} className={cn("text-[13px] text-ink-2", className)} {...props} />
));
ModalDescription.displayName = "ModalDescription";
