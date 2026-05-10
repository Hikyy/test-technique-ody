"use client";

import { Field } from "@base-ui-components/react/field";
import * as React from "react";
import { cn } from "../../lib/cn";

// TODO: verify Base UI <Field> API

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  label: string;
  name?: string;
  error?: string | undefined;
  hint?: string | undefined;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, name, required, containerClassName, className, ...rest }, ref) => {
    return (
      <Field.Root
        name={name}
        invalid={Boolean(error) || undefined}
        className={cn("flex flex-col gap-1.5", containerClassName)}
      >
        <Field.Label className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
          {label}
          {required && <span className="ml-1 text-neg">*</span>}
        </Field.Label>
        <Field.Control
          ref={ref}
          required={required}
          className={cn(
            "flex h-10 w-full rounded-[8px] border border-line-mid bg-surface px-3 py-2",
            "font-sans text-[13.5px] text-ink placeholder:text-ink-3",
            "transition-colors",
            "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
            "data-[invalid]:border-neg data-[invalid]:focus-visible:ring-neg/25",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...rest}
        />
        {error ? (
          <Field.Error className="text-[11.5px] text-neg">{error}</Field.Error>
        ) : hint ? (
          <Field.Description className="text-[11.5px] text-ink-3">{hint}</Field.Description>
        ) : null}
      </Field.Root>
    );
  },
);
FormField.displayName = "FormField";
