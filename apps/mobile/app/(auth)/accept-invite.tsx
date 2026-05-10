import { zodResolver } from "@hookform/resolvers/zod";
import { type AcceptInvitationInput, acceptInvitationSchema } from "@ody/sdk";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { apiBaseUrl } from "../../src/lib/api-client";
import { getSession, signOut } from "../../src/lib/auth-client";
import { useTranslations } from "../../src/lib/i18n";
import { Button } from "../../src/ui/Button";
import { FormField } from "../../src/ui/FormField";

interface InvitationPreview {
  email: string;
  role: "owner" | "manager" | "staff";
  restaurant_name: string;
  expires_at: string;
}

export default function AcceptInviteScreen() {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { token } = useLocalSearchParams<{ token?: string }>();
  const tokenStr = token ?? "";

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { token: tokenStr, name: "", password: "" },
  });

  useEffect(() => {
    setValue("token", tokenStr);

    if (!tokenStr) {
      setPreviewError(tAuth("inviteInvalidBody"));
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const session = await getSession();

        if (session.data?.user) {
          await signOut();
        }

        const r = await fetch(`${apiBaseUrl}/api/invitations/by-token/${encodeURIComponent(tokenStr)}`);

        if (!r.ok) {
          if (!cancelled) setPreviewError(tAuth("inviteInvalidBody"));
          return;
        }

        const json = (await r.json()) as { data: { attributes: InvitationPreview } };

        if (!cancelled) setPreview(json.data.attributes);
      } catch {
        if (!cancelled) setPreviewError(tErrors("network"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenStr, setValue, tAuth, tErrors]);

  const onSubmit = async (values: AcceptInvitationInput) => {
    try {
      const r = await fetch(`${apiBaseUrl}/api/invitations/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (r.status === 409) {
        Toast.show({ type: "error", text1: tAuth("inviteSignOutFirst") });
        return;
      }

      if (!r.ok) {
        Toast.show({ type: "error", text1: tAuth("inviteInvalidBody") });
        return;
      }

      Toast.show({ type: "success", text1: tAuth("inviteSuccess") });
      router.replace("/(auth)/login");
    } catch {
      Toast.show({ type: "error", text1: tErrors("network") });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        {previewLoading ? (
          <ActivityIndicator />
        ) : previewError || !preview ? (
          <View className="gap-3">
            <Text className="font-serif text-[36px] leading-[40px] text-ink">{tAuth("inviteInvalidTitle")}</Text>
            <Text className="font-sans text-[14px] text-ink-2">{previewError ?? tAuth("inviteInvalidBody")}</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link" className="pt-2">
                <Text className="text-accent">{tAuth("signIn")}</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <>
            <View className="mb-8">
              <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{preview.email}</Text>
              <Text className="mt-2 font-serif text-[40px] leading-[44px] text-ink">{tAuth("acceptInviteTitle")}</Text>
              <Text className="mt-3 font-sans text-[14px] text-ink-2">
                {tAuth("acceptInviteSubtitle", { restaurant: preview.restaurant_name })}
              </Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <FormField
                    label={tAuth("name")}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    error={errors.name?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <FormField
                    label={tAuth("password")}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    secureTextEntry
                    autoComplete="new-password"
                    error={errors.password?.message}
                  />
                )}
              />
              <Button
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                accessibilityLabel={tAuth("acceptInvite")}
              >
                {tAuth("acceptInvite")}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
