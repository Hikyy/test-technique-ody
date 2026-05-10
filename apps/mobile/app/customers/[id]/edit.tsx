import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateCustomerInput,
  createCustomerSchema,
  type UpdateCustomerDTO,
  useCustomer,
  useUpdateCustomer,
} from "@ody/sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useTranslations } from "../../../src/lib/i18n";
import { Button } from "../../../src/ui/Button";
import { FormField } from "../../../src/ui/FormField";

type FormValues = CreateCustomerInput;

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const customer = useCustomer(id);
  const update = useUpdateCustomer();
  const tCustomers = useTranslations("customers");
  const tCommon = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "", notes: "" },
  });

  useEffect(() => {
    const a = customer.data?.attributes;

    if (!a) return;

    form.reset({
      first_name: a.first_name,
      last_name: a.last_name,
      email: a.email ?? "",
      phone: a.phone ?? "",
      notes: a.notes ?? "",
    });
  }, [customer.data, form]);

  const onSubmit = (values: FormValues) => {
    if (!id) return;

    const patch: UpdateCustomerDTO = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email ? values.email : null,
      phone: values.phone ? values.phone : null,
      notes: values.notes ? values.notes : null,
    };

    update.mutate(
      { id, patch },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: tCustomers("updated") });
          router.back();
        },
        onError: (err) => Toast.show({ type: "error", text1: tCommon("save"), text2: err.message }),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable accessibilityRole="button" onPress={() => router.back()} className="flex-row items-center gap-1.5">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="m15 6-6 6 6 6"
              stroke="#15140f"
              strokeOpacity={0.62}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text className="font-sans text-[13px] text-ink-2">{tCommon("back")}</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{tCustomers("eyebrow")}</Text>
        <Text className="mt-1 font-serif italic text-[32px] leading-[36px] text-accent">{tCustomers("edit")}</Text>
      </View>

      {customer.isLoading || !customer.data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 16 }}>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormField
                      label={tCustomers("firstName")}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={form.formState.errors.first_name?.message}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormField
                      label={tCustomers("lastName")}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={form.formState.errors.last_name?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormField
                  label={tCustomers("email")}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={form.formState.errors.email?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormField
                  label={tCustomers("phone")}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="phone-pad"
                  error={form.formState.errors.phone?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormField
                  label={tCustomers("notes")}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  numberOfLines={3}
                  error={form.formState.errors.notes?.message}
                />
              )}
            />
          </ScrollView>

          <View
            style={{ paddingBottom: insets.bottom + 10 }}
            className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-line bg-bg px-5 pt-2.5"
          >
            <View className="flex-1">
              <Button variant="ghost" onPress={() => router.back()}>
                {tCommon("cancel")}
              </Button>
            </View>
            <View className="flex-[1.4]">
              <Button variant="ink" loading={update.isPending} onPress={form.handleSubmit(onSubmit)}>
                {tCommon("save")}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
