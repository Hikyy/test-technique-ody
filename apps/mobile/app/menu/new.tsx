import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateDishDTO, type CreateDishInput, createDishSchema, useCategories, useCreateDish } from "@ody/sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useTranslations } from "../../src/lib/i18n";
import { Button } from "../../src/ui/Button";
import { FormField } from "../../src/ui/FormField";

type FormValues = CreateDishInput;

export default function NewDishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tCommon = useTranslations("common");
  const tMenu = useTranslations("menu");
  const params = useLocalSearchParams<{ category_id?: string }>();
  const cats = useCategories();
  const create = useCreateDish();
  const categories = cats.data?.items ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(createDishSchema),
    defaultValues: {
      category_id: params.category_id ?? "",
      name: "",
      description: "",
      price_eur: 0,
      available: true,
      image_url: "",
    },
  });

  const selectedCategoryId = form.watch("category_id");

  const onSubmit = (values: FormValues) => {
    const payload: CreateDishDTO = {
      category_id: values.category_id,
      name: values.name,
      description: values.description ? values.description : null,
      price_cents: Math.round(values.price_eur * 100),
      available: values.available,
    };

    create.mutate(payload, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: tMenu("new.toastCreated") });
        router.back();
      },
      onError: (err) => Toast.show({ type: "error", text1: tCommon("failure"), text2: err.message }),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tCommon("back")}
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5"
        >
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
          <Text className="font-sans text-[13px] text-ink-2">{tMenu("title")}</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{tMenu("new.eyebrow")}</Text>
        <Text className="mt-1 font-serif italic text-[32px] leading-[36px] text-accent">{tMenu("newDish")}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 16 }}>
          <View className="gap-1.5">
            <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-2">{tMenu("category")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {categories.map((c) => {
                const active = c.id === selectedCategoryId;

                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    onPress={() => form.setValue("category_id", c.id, { shouldValidate: true })}
                    className={`px-3 py-2 rounded-full border ${active ? "bg-ink border-ink" : "border-line-mid"}`}
                  >
                    <Text className={`font-sans text-[12px] ${active ? "text-bg" : "text-ink-2"}`}>
                      {c.attributes.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {form.formState.errors.category_id?.message && (
              <Text className="font-sans text-[12px] text-neg">{form.formState.errors.category_id.message}</Text>
            )}
          </View>

          <Controller
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormField
                label={tMenu("name")}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={form.formState.errors.name?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormField
                label={tMenu("description")}
                value={field.value ?? ""}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                numberOfLines={3}
                error={form.formState.errors.description?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="price_eur"
            render={({ field }) => (
              <FormField
                label={tMenu("priceEur")}
                value={String(field.value ?? "")}
                onChangeText={(v) => field.onChange(v.replace(",", "."))}
                onBlur={field.onBlur}
                keyboardType="decimal-pad"
                error={form.formState.errors.price_eur?.message}
              />
            )}
          />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.watch("available") }}
            onPress={() => form.setValue("available", !form.getValues("available"))}
            className="flex-row items-center justify-between rounded-card border border-line-mid bg-surface px-4 py-3 active:opacity-70"
          >
            <Text className="font-sans text-[14px] text-ink">{tMenu("available")}</Text>
            <View
              className={`size-6 rounded-full items-center justify-center ${
                form.watch("available") ? "bg-accent" : "border border-line-mid"
              }`}
            >
              {form.watch("available") ? <Text className="text-bg text-[14px] leading-[14px]">✓</Text> : null}
            </View>
          </Pressable>
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
            <Button variant="ink" loading={create.isPending} onPress={form.handleSubmit(onSubmit)}>
              {tMenu("new.createButton")}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
