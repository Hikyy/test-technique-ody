import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterInput, registerSchema } from "@ody/sdk";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { signUp } from "../../src/lib/auth-client";
import { useTranslations } from "../../src/lib/i18n";
import { Button } from "../../src/ui/Button";
import { FormField } from "../../src/ui/FormField";

type FormValues = RegisterInput;

export default function RegisterScreen() {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await signUp.email(values);

    if (result.error) {
      const code = result.error.status ?? 0;

      Toast.show({
        type: "error",
        text1: code === 409 || code === 422 ? tAuth("emailAlreadyUsed") : tAuth("invalidCredentials"),
        text2: result.error.message ?? undefined,
      });

      return;
    }

    Toast.show({ type: "success", text1: tAuth("registerSuccess") });
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-8">
          <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{tCommon("eveningService")}</Text>
          <Text className="mt-2 font-serif text-[44px] leading-[44px] text-ink">{tAuth("registerTitle")}</Text>
          <Text className="mt-3 font-sans text-[14px] text-ink-2">{tAuth("registerSubtitle")}</Text>
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
            name="email"
            render={({ field }) => (
              <FormField
                label={tAuth("email")}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
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
          <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} accessibilityLabel={tAuth("register")}>
            {tAuth("register")}
          </Button>

          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link" className="pt-2">
              <Text className="text-center font-sans text-[13px] text-ink-2">
                {tAuth("haveAccount")} <Text className="text-accent">{tAuth("signIn")}</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
