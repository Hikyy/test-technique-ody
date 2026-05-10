"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateCustomerInput, createCustomerSchema } from "@ody/sdk";
import {
  Button,
  FormField,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@ody/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateCustomer } from "@/lib/hooks/use-create-customer";
import type { CustomerData } from "@/lib/hooks/use-customers";
import { useUpdateCustomer } from "@/lib/hooks/use-update-customer";

type FormValues = CreateCustomerInput;

const emptyValues: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  notes: "",
};

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerData | null;
  onCreated?: (customer: CustomerData) => void;
}

export function CustomerFormModal({ open, onOpenChange, customer, onCreated }: CustomerFormModalProps) {
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isEdit = Boolean(customer);

  const form = useForm<FormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;
    if (customer) {
      form.reset({
        first_name: customer.attributes.first_name,
        last_name: customer.attributes.last_name,
        email: customer.attributes.email ?? "",
        phone: customer.attributes.phone ?? "",
        notes: customer.attributes.notes ?? "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [open, customer, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email ? values.email : null,
      phone: values.phone ? values.phone : null,
      notes: values.notes ? values.notes : null,
    };

    if (isEdit && customer) {
      update.mutate(
        { id: customer.id, patch: payload },
        {
          onSuccess: () => {
            toast.success(tCustomers("updated"));
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success(tCustomers("created"));
        form.reset(emptyValues);
        onOpenChange(false);
        onCreated?.(created);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent variant="center" className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{isEdit ? tCustomers("edit") : tCustomers("new")}</ModalTitle>
          <ModalDescription>{isEdit ? tCustomers("descriptionEdit") : tCustomers("descriptionNew")}</ModalDescription>
        </ModalHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={tCustomers("firstName")}
              required
              error={form.formState.errors.first_name?.message}
              {...form.register("first_name")}
            />
            <FormField
              label={tCustomers("lastName")}
              required
              error={form.formState.errors.last_name?.message}
              {...form.register("last_name")}
            />
          </div>

          <FormField
            label={tCustomers("email")}
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />

          <FormField
            label={tCustomers("phone")}
            type="tel"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="customer-notes" className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
              {tCustomers("notes")}
            </label>
            <textarea
              id="customer-notes"
              rows={4}
              placeholder={tCustomers("notesPlaceholder")}
              className="flex w-full rounded-[8px] border border-line-mid bg-surface px-3 py-2 font-sans text-[13.5px] text-ink placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              {...form.register("notes")}
            />
            {form.formState.errors.notes?.message && (
              <p className="text-[11.5px] text-neg">{form.formState.errors.notes.message}</p>
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? tCustomers("saving") : isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
