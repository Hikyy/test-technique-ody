"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterInput, registerSchema } from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type FormValues = RegisterInput;

export default function RegisterPage() {
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
  });

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const res = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (res.error) {
      const code = res.error.status ?? 0;
      if (code === 409 || code === 422) toast.error(tAuth("emailAlreadyUsed"));
      else toast.error(res.error.message ?? tErrors("generic"));
      return;
    }

    toast.success(tAuth("registerSuccess"));
    router.replace("/dashboard");
    router.refresh();
  }

  const nameError = form.formState.errors.name ? tAuth("nameRequired") : undefined;
  const emailError = form.formState.errors.email ? tAuth("emailInvalid") : undefined;
  const passwordError = form.formState.errors.password ? tAuth("passwordTooShort") : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6">
      <div className="w-full max-w-[380px] rounded-card border border-line bg-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-[26px] place-items-center rounded-[6px] bg-ink pb-0.5 font-serif text-[18px] italic leading-none text-bg">
            S
          </div>
          <div className="font-serif text-[19px] italic">Sève</div>
        </div>
        <h1 className="font-serif text-[26px] italic text-ink">{tAuth("registerTitle")}</h1>
        <p className="mt-1 text-[13px] text-ink-2">{tAuth("registerSubtitle")}</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          <FormField
            label={tAuth("name")}
            type="text"
            autoComplete="name"
            error={nameError}
            {...form.register("name")}
          />
          <FormField
            label={tAuth("email")}
            type="email"
            autoComplete="email"
            error={emailError}
            {...form.register("email")}
          />
          <FormField
            label={tAuth("password")}
            type="password"
            autoComplete="new-password"
            error={passwordError}
            {...form.register("password")}
          />
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? tAuth("registering") : tAuth("register")}
          </Button>
        </form>
        <p className="mt-6 text-center text-[12.5px] text-ink-2">
          {tAuth("haveAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {tAuth("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
