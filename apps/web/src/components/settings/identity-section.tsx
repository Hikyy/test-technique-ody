"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type UpdateSettingsIdentityInput, updateSettingsIdentitySchema } from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { SettingsAttributesData } from "@/lib/hooks/use-settings";
import { useUpdateSettings } from "@/lib/hooks/use-update-settings";

type FormValues = UpdateSettingsIdentityInput;

interface Props {
  attributes: SettingsAttributesData;
}

export function IdentitySection({ attributes }: Props) {
  const tSettings = useTranslations("settings");
  const update = useUpdateSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(updateSettingsIdentitySchema),
    defaultValues: {
      name: attributes.name,
      address: attributes.address,
      phone: attributes.phone ?? "",
      contact_email: attributes.contact_email ?? "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({
      name: attributes.name,
      address: attributes.address,
      phone: attributes.phone ?? "",
      contact_email: attributes.contact_email ?? "",
    });
  }, [attributes, form]);

  const onSubmit = (values: FormValues) => {
    update.mutate(
      {
        name: values.name,
        address: values.address,
        phone: values.phone ? values.phone : null,
        contact_email: values.contact_email ? values.contact_email : null,
      },
      {
        onSuccess: () => toast.success(tSettings("saved")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <section className="rounded-card border border-line bg-surface px-7 py-6">
      <header className="mb-2">
        <h2 className="font-serif text-[22px] italic text-ink">{tSettings("restaurant")}</h2>
        <p className="mt-1 text-[12px] text-ink-2">{tSettings("restaurantHint")}</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
        <FormField
          label={tSettings("name")}
          required
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <FormField
          label={tSettings("address")}
          required
          error={form.formState.errors.address?.message}
          {...form.register("address")}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label={tSettings("phone")}
            type="tel"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />
          <FormField
            label={tSettings("contactEmail")}
            type="email"
            error={form.formState.errors.contact_email?.message}
            {...form.register("contact_email")}
          />
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" variant="ink" disabled={update.isPending}>
            {update.isPending ? tSettings("saving") : tSettings("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
