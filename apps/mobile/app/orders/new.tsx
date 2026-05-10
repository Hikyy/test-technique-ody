import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateOrderDTO,
  type CreateOrderLineDTO,
  type CustomerData,
  type DishData,
  orderLineSchema,
  useCreateCustomer,
  useCreateOrder,
  useCustomers,
  useDishes,
} from "@ody/sdk";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { formatCents } from "../../src/lib/format";
import { useTranslations } from "../../src/lib/i18n";
import { Button } from "../../src/ui/Button";
import { FormField } from "../../src/ui/FormField";

// Mobile uses `scheduled_at_minutes` (offset from now) which is converted to
// an absolute `scheduled_at` ISO string at submit time. The line shape is the
// shared `orderLineSchema` from the SDK.
const schema = z.object({
  table_number: z.coerce.number().int().min(1).max(99),
  scheduled_at_minutes: z.coerce.number().int().min(0).max(720),
  notes: z.string().max(2000).optional(),
  lines: z.array(orderLineSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

export default function NewOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");
  const tCustomers = useTranslations("customers");
  const dishesQuery = useDishes();
  const create = useCreateOrder();
  const dishes = (dishesQuery.data?.items ?? []) as DishData[];
  const availableDishes = dishes.filter((d) => d.attributes.available);

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { table_number: 1, scheduled_at_minutes: 30, notes: "", lines: [] },
  });

  const lines = useFieldArray({ control: form.control, name: "lines" });

  const addDish = (dish: DishData) => {
    lines.append({ dish_id: dish.id, qty: 1, unit_price_cents: dish.attributes.price_cents });
  };

  const onSubmit = (values: FormValues) => {
    const scheduledAt = new Date(Date.now() + values.scheduled_at_minutes * 60_000).toISOString();
    const payload: CreateOrderDTO = {
      table_number: values.table_number,
      customer_id: customer?.id ?? null,
      scheduled_at: scheduledAt,
      notes: values.notes ? values.notes : null,
      lines: values.lines.map<CreateOrderLineDTO>((l) => ({
        dish_id: l.dish_id,
        qty: l.qty,
        unit_price_cents: l.unit_price_cents,
        notes: null,
      })),
    };

    create.mutate(payload, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: tOrders("newScreen.toastCreated") });
        router.back();
      },
      onError: (err) => Toast.show({ type: "error", text1: tCommon("failure"), text2: err.message }),
    });
  };

  const total = form.watch("lines").reduce((sum, l) => sum + (l.qty ?? 0) * (l.unit_price_cents ?? 0), 0);

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
          <Text className="font-sans text-[13px] text-ink-2">{tOrders("title")}</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-3">{tCommon("eveningService")}</Text>
        <Text className="mt-1 font-serif italic text-[32px] leading-[36px] text-accent">{tOrders("new")}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 16 }}>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={form.control}
                name="table_number"
                render={({ field }) => (
                  <FormField
                    label={tOrders("newScreen.tableLabel")}
                    value={String(field.value ?? "")}
                    onChangeText={(v) => field.onChange(v.replace(/[^0-9]/g, ""))}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    error={form.formState.errors.table_number?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={form.control}
                name="scheduled_at_minutes"
                render={({ field }) => (
                  <FormField
                    label={tOrders("newScreen.scheduleLabel")}
                    value={String(field.value ?? "")}
                    onChangeText={(v) => field.onChange(v.replace(/[^0-9]/g, ""))}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    error={form.formState.errors.scheduled_at_minutes?.message}
                  />
                )}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-2">{tOrders("pickCustomer")}</Text>
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => setPickerOpen(true)}
                className="flex-1 rounded-card border border-line-mid bg-surface px-3.5 py-3"
              >
                <Text className="font-sans text-[13.5px] text-ink" numberOfLines={1}>
                  {customer
                    ? `${customer.attributes.last_name} ${customer.attributes.first_name}`.trim()
                    : tOrders("noneCustomerShort")}
                </Text>
              </Pressable>
              {customer ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCustomer(null)}
                  className="rounded-card border border-line-mid bg-bg px-3 items-center justify-center"
                >
                  <Text className="font-sans text-[13.5px] text-ink-2">×</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-2">
              {tOrders("newScreen.dishesLabel")}
            </Text>

            {lines.fields.length === 0 ? (
              <Text className="font-serif italic text-[14px] text-ink-3 py-2">
                {tOrders("newScreen.noDishesSelected")}
              </Text>
            ) : (
              lines.fields.map((field, idx) => {
                const dish = dishes.find((d) => d.id === form.watch(`lines.${idx}.dish_id`));
                const qty = form.watch(`lines.${idx}.qty`);

                return (
                  <View
                    key={field.id}
                    className="flex-row items-center gap-2 rounded-card border border-line bg-surface p-3"
                  >
                    <View className="flex-1">
                      <Text className="font-sans text-[13.5px] text-ink" numberOfLines={1}>
                        {dish?.attributes.name ?? "—"}
                      </Text>
                      <Text className="font-mono text-[11.5px] text-ink-2">
                        {formatCents(form.watch(`lines.${idx}.unit_price_cents`))}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={tOrders("newScreen.decrease")}
                      onPress={() => {
                        const current = form.getValues(`lines.${idx}.qty`);

                        if (current <= 1) {
                          lines.remove(idx);
                          return;
                        }

                        form.setValue(`lines.${idx}.qty`, current - 1, { shouldValidate: true });
                      }}
                      className="size-9 rounded-full border border-line-mid items-center justify-center"
                    >
                      <Text className="font-sans text-[16px] text-ink">−</Text>
                    </Pressable>
                    <Text className="font-mono text-[14px] text-ink min-w-[24px] text-center">{qty}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={tOrders("newScreen.increase")}
                      onPress={() => {
                        const current = form.getValues(`lines.${idx}.qty`);
                        form.setValue(`lines.${idx}.qty`, Math.min(99, current + 1), { shouldValidate: true });
                      }}
                      className="size-9 rounded-full border border-line-mid items-center justify-center"
                    >
                      <Text className="font-sans text-[16px] text-ink">+</Text>
                    </Pressable>
                  </View>
                );
              })
            )}

            {form.formState.errors.lines?.message && (
              <Text className="font-sans text-[12px] text-neg">{form.formState.errors.lines.message}</Text>
            )}
          </View>

          <DishPicker dishes={availableDishes} onPick={addDish} />

          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormField
                label={tOrders("notes")}
                value={field.value ?? ""}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                numberOfLines={2}
                placeholder={tOrders("newScreen.notesPlaceholder")}
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
            <Button variant="ink" loading={create.isPending} onPress={form.handleSubmit(onSubmit)}>
              {tOrders("newScreen.createWithTotal", { total: formatCents(total) })}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomerPickerModal
        visible={pickerOpen}
        selected={customer}
        onClose={() => setPickerOpen(false)}
        onPick={(c) => {
          setCustomer(c);
          setPickerOpen(false);
        }}
        onRequestNew={() => {
          setPickerOpen(false);
          setCreateOpen(true);
        }}
      />

      <CustomerCreateModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(c) => {
          setCustomer(c);
          setCreateOpen(false);
          Toast.show({ type: "success", text1: tCustomers("created") });
        }}
      />
    </SafeAreaView>
  );
}

function CustomerPickerModal({
  visible,
  selected,
  onClose,
  onPick,
  onRequestNew,
}: {
  visible: boolean;
  selected: CustomerData | null;
  onClose: () => void;
  onPick: (c: CustomerData) => void;
  onRequestNew: () => void;
}) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const tCustomers = useTranslations("customers");
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const customersQuery = useCustomers({ search: search.length >= 2 ? search : undefined, pageSize: 30 });
  const items = (customersQuery.data?.items ?? []) as CustomerData[];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text className="font-sans text-[14px] text-ink-2">{tCommon("cancel")}</Text>
          </Pressable>
          <Text className="font-serif italic text-[18px] text-accent">{tOrders("pickCustomer")}</Text>
          <View className="w-12" />
        </View>

        <View className="px-5 pt-2">
          <FormField
            label={tCommon("searchPlaceholder")}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onRequestNew}
            className="rounded-card border border-line-mid bg-surface px-3.5 py-3 active:opacity-70"
          >
            <Text className="font-sans text-[14px] text-accent">+ {tCustomers("new")}</Text>
          </Pressable>

          {items.map((c) => {
            const isSelected = selected?.id === c.id;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onPick(c)}
                className={`rounded-card border ${isSelected ? "border-accent" : "border-line"} bg-bg px-3.5 py-3 active:bg-accent-soft`}
              >
                <Text className="font-sans text-[13.5px] text-ink">
                  {c.attributes.last_name} {c.attributes.first_name}
                </Text>
                {c.attributes.email ? (
                  <Text className="font-mono text-[11.5px] text-ink-3 mt-0.5">{c.attributes.email}</Text>
                ) : null}
              </Pressable>
            );
          })}

          {items.length === 0 && !customersQuery.isLoading ? (
            <Text className="font-serif italic text-[13px] text-ink-3 py-2">{tOrders("noResults")}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CustomerCreateModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (c: CustomerData) => void;
}) {
  const tCommon = useTranslations("common");
  const tCustomers = useTranslations("customers");
  const insets = useSafeAreaInsets();
  const create = useCreateCustomer();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
  };

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    create.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() ? email.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
      },
      {
        onSuccess: (c) => {
          reset();
          onCreated(c);
        },
        onError: (err) => Toast.show({ type: "error", text1: err.message }),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              reset();
              onClose();
            }}
          >
            <Text className="font-sans text-[14px] text-ink-2">{tCommon("cancel")}</Text>
          </Pressable>
          <Text className="font-serif italic text-[18px] text-accent">{tCustomers("new")}</Text>
          <View className="w-12" />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90, gap: 12 }}>
            <FormField
              label={tCustomers("firstName")}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <FormField
              label={tCustomers("lastName")}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            <FormField
              label={tCustomers("email")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FormField label={tCustomers("phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </ScrollView>

          <View
            style={{ paddingBottom: insets.bottom + 10 }}
            className="absolute bottom-0 left-0 right-0 border-t border-line bg-bg px-5 pt-2.5"
          >
            <Button
              variant="ink"
              loading={create.isPending}
              disabled={!firstName.trim() || !lastName.trim()}
              onPress={submit}
            >
              {tCommon("create")}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function DishPicker({ dishes, onPick }: { dishes: DishData[]; onPick: (d: DishData) => void }) {
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState("");
  const visible = query ? dishes.filter((d) => d.attributes.name.toLowerCase().includes(query.toLowerCase())) : dishes;

  return (
    <View className="gap-2">
      <FormField
        label={tOrders("newScreen.addDish")}
        value={query}
        onChangeText={setQuery}
        placeholder={tCommon("searchPlaceholder")}
      />

      <View className="gap-1.5">
        {visible.slice(0, 8).map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            onPress={() => {
              onPick(d);
              setQuery("");
            }}
            className="flex-row items-center justify-between rounded-card border border-line bg-bg px-3 py-2.5 active:bg-accent-soft"
          >
            <Text className="font-sans text-[13.5px] text-ink flex-1" numberOfLines={1}>
              {d.attributes.name}
            </Text>
            <Text className="font-mono text-[12px] text-ink-2">{formatCents(d.attributes.price_cents)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
