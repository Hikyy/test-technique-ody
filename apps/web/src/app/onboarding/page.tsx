"use client";

import {
  type CategoryData,
  type CreateCategoryDTO,
  type CreateCustomerDTO,
  type CreateDishDTO,
  type DishData,
  type RestaurantSettingsAttributes,
  type SeedScope,
  type UpdateDishDTO,
  useCategories,
  useCompleteOnboarding,
  useCreateCategory,
  useCreateCustomer,
  useCreateDish,
  useCreateTable,
  useCustomers,
  useDeleteTable,
  useDishes,
  useOnboardingStatus,
  useSeedRestaurant,
  useSettings,
  useTables,
  useUpdateDish,
  useUpdateSettings,
} from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StepShell } from "@/components/onboarding/step-shell";

type Step = "welcome" | "identity" | "hours" | "tables" | "menu" | "customers" | "done";

const SAMPLE_RESTAURANT = {
  name: "Sève",
  address: "14 quai Joffre, 69002 Lyon",
  phone: "+33 4 78 00 00 00",
};

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type UiSlot = { open_at: string; close_at: string; closed: boolean };
type OpeningHoursState = Record<DayKey, UiSlot>;

const DAY_KEYS: ReadonlyArray<DayKey> = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const SAMPLE_HOURS: OpeningHoursState = {
  monday: { open_at: "12:00", close_at: "14:00", closed: false },
  tuesday: { open_at: "12:00", close_at: "14:00", closed: false },
  wednesday: { open_at: "12:00", close_at: "14:00", closed: false },
  thursday: { open_at: "12:00", close_at: "14:00", closed: false },
  friday: { open_at: "12:00", close_at: "14:00", closed: false },
  saturday: { open_at: "19:00", close_at: "23:00", closed: false },
  sunday: { open_at: "12:00", close_at: "14:30", closed: true },
};

const EMPTY_HOURS: OpeningHoursState = {
  monday: { open_at: "12:00", close_at: "22:00", closed: false },
  tuesday: { open_at: "12:00", close_at: "22:00", closed: false },
  wednesday: { open_at: "12:00", close_at: "22:00", closed: false },
  thursday: { open_at: "12:00", close_at: "22:00", closed: false },
  friday: { open_at: "12:00", close_at: "22:00", closed: false },
  saturday: { open_at: "12:00", close_at: "22:00", closed: false },
  sunday: { open_at: "12:00", close_at: "22:00", closed: true },
};

const STEP_ORDER: Exclude<Step, "welcome" | "done">[] = ["identity", "hours", "tables", "menu", "customers"];
const TOTAL_STEPS = STEP_ORDER.length;

function hoursFromAttributes(attrs: RestaurantSettingsAttributes | undefined): OpeningHoursState {
  if (!attrs?.opening_hours) return EMPTY_HOURS;

  const out = { ...EMPTY_HOURS } as OpeningHoursState;

  for (const k of DAY_KEYS) {
    const day = attrs.opening_hours[k];

    if (day && typeof day === "object" && "open_at" in day) {
      out[k] = { open_at: day.open_at, close_at: day.close_at, closed: false };
    } else {
      out[k] = { ...EMPTY_HOURS[k], closed: true };
    }
  }

  return out;
}

function hoursToWire(state: OpeningHoursState): Record<DayKey, { open_at: string; close_at: string } | null> {
  return DAY_KEYS.reduce(
    (acc, k) => {
      const s = state[k];
      acc[k] = s.closed ? null : { open_at: s.open_at, close_at: s.close_at };
      return acc;
    },
    {} as Record<DayKey, { open_at: string; close_at: string } | null>,
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const tOnboarding = useTranslations("onboarding");
  const tErrors = useTranslations("errors");
  const tDays = useTranslations("settings.days");

  const status = useOnboardingStatus();
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const seed = useSeedRestaurant();
  const complete = useCompleteOnboarding();

  const [step, setStep] = useState<Step>("welcome");
  const [identity, setIdentity] = useState({ name: "", address: "", phone: "" });
  const [hours, setHours] = useState<OpeningHoursState>(EMPTY_HOURS);

  useEffect(() => {
    const a = settings.data?.attributes;
    if (!a) return;
    setIdentity({ name: a.name ?? "", address: a.address ?? "", phone: a.phone ?? "" });
    setHours(hoursFromAttributes(a));
  }, [settings.data]);

  useEffect(() => {
    if (status.data?.attributes.onboarded_at) router.replace("/dashboard");
  }, [status.data, router]);

  const stepIndex = step === "welcome" || step === "done" ? 0 : STEP_ORDER.indexOf(step) + 1;
  const counts = status.data?.attributes.counts;

  const goNext = (next: Step) => setStep(next);

  const runSeed = async (scopes: SeedScope[]) => {
    try {
      await seed.mutateAsync(scopes);
      toast.success(tOnboarding("sampleSuccess"));
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  const finishOnboarding = async () => {
    try {
      await complete.mutateAsync();
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  if (step === "welcome") {
    return (
      <div className="mt-8 flex flex-col gap-7">
        <div className="text-[11.5px] uppercase tracking-[0.06em] text-ink-3">{tOnboarding("welcome.eyebrow")}</div>
        <h1 className="font-serif text-[44px] leading-[48px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
          {tOnboarding("welcome.title")}
        </h1>
        <p className="text-[14px] text-ink-2">{tOnboarding("welcome.subtitle")}</p>
        <div className="pt-4">
          <Button variant="ink" onClick={() => goNext("identity")}>
            {tOnboarding("welcome.cta")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mt-8 flex flex-col gap-7">
        <div className="text-[11.5px] uppercase tracking-[0.06em] text-ink-3">{tOnboarding("welcome.eyebrow")}</div>
        <h1 className="font-serif text-[44px] leading-[48px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
          {tOnboarding("done.title")}
        </h1>
        <p className="text-[14px] text-ink-2">{tOnboarding("done.subtitle")}</p>
        <div className="pt-4">
          <Button variant="ink" onClick={finishOnboarding} disabled={complete.isPending}>
            {complete.isPending ? tOnboarding("completing") : tOnboarding("done.cta")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "identity") {
    const saveIdentity = async (next: Step) => {
      try {
        await updateSettings.mutateAsync({
          name: identity.name,
          address: identity.address ? identity.address : null,
          phone: identity.phone ? identity.phone : null,
        });
        goNext(next);
      } catch (err) {
        toast.error((err as Error).message ?? tErrors("generic"));
      }
    };

    return (
      <StepShell
        step={stepIndex}
        totalSteps={TOTAL_STEPS}
        title={tOnboarding("identity.title")}
        subtitle={tOnboarding("identity.subtitle")}
        primaryLabel={tOnboarding("continue")}
        onPrimary={() => saveIdentity("hours")}
        primaryDisabled={!identity.name.trim()}
        primaryLoading={updateSettings.isPending}
        secondaryLabel={tOnboarding("skip")}
        onSecondary={() => goNext("hours")}
        sample={{
          hint: tOnboarding("identity.sampleHint"),
          onClick: () => setIdentity(SAMPLE_RESTAURANT),
        }}
      >
        <FormField
          label={tOnboarding("identity.name")}
          value={identity.name}
          onChange={(e) => setIdentity({ ...identity, name: e.currentTarget.value })}
          required
        />
        <FormField
          label={tOnboarding("identity.address")}
          value={identity.address}
          onChange={(e) => setIdentity({ ...identity, address: e.currentTarget.value })}
        />
        <FormField
          label={tOnboarding("identity.phone")}
          value={identity.phone}
          onChange={(e) => setIdentity({ ...identity, phone: e.currentTarget.value })}
        />
      </StepShell>
    );
  }

  if (step === "hours") {
    const saveHours = async (next: Step) => {
      try {
        await updateSettings.mutateAsync({ opening_hours: hoursToWire(hours) });
        goNext(next);
      } catch (err) {
        toast.error((err as Error).message ?? tErrors("generic"));
      }
    };

    const updateDay = (day: DayKey, patch: Partial<UiSlot>) => {
      setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    };

    return (
      <StepShell
        step={stepIndex}
        totalSteps={TOTAL_STEPS}
        title={tOnboarding("hours.title")}
        subtitle={tOnboarding("hours.subtitle")}
        primaryLabel={tOnboarding("continue")}
        onPrimary={() => saveHours("tables")}
        primaryLoading={updateSettings.isPending}
        secondaryLabel={tOnboarding("skip")}
        onSecondary={() => goNext("tables")}
        onBack={() => goNext("identity")}
        sample={{
          hint: tOnboarding("hours.sampleHint"),
          onClick: () => setHours(SAMPLE_HOURS),
        }}
      >
        <div className="flex flex-col gap-2">
          {DAY_KEYS.map((day) => {
            const slot = hours[day];
            return (
              <div key={day} className="grid grid-cols-[88px_1fr_1fr_auto] items-center gap-3">
                <span className="text-[13px] text-ink-2">{tDays(day)}</span>
                <input
                  type="time"
                  value={slot.open_at}
                  disabled={slot.closed}
                  onChange={(e) => updateDay(day, { open_at: e.currentTarget.value })}
                  className="h-9 rounded-[8px] border border-line-mid bg-surface px-2 font-mono text-[13px] text-ink disabled:opacity-50"
                />
                <input
                  type="time"
                  value={slot.close_at}
                  disabled={slot.closed}
                  onChange={(e) => updateDay(day, { close_at: e.currentTarget.value })}
                  className="h-9 rounded-[8px] border border-line-mid bg-surface px-2 font-mono text-[13px] text-ink disabled:opacity-50"
                />
                <label className="inline-flex items-center gap-2 text-[12px] text-ink-2">
                  <input
                    type="checkbox"
                    checked={slot.closed}
                    onChange={(e) => updateDay(day, { closed: e.currentTarget.checked })}
                    className="size-4 accent-ink"
                  />
                  {tOnboarding("hours.closed")}
                </label>
              </div>
            );
          })}
        </div>
      </StepShell>
    );
  }

  if (step === "tables") {
    return (
      <TablesStep
        stepIndex={stepIndex}
        totalSteps={TOTAL_STEPS}
        onContinue={() => goNext("menu")}
        onSkip={() => goNext("menu")}
        onBack={() => goNext("hours")}
      />
    );
  }

  if (step === "menu") {
    return (
      <MenuStep
        stepIndex={stepIndex}
        totalSteps={TOTAL_STEPS}
        counts={counts}
        sampleLoading={seed.isPending}
        onSeed={() => runSeed(["menu"])}
        onContinue={() => goNext("customers")}
        onBack={() => goNext("tables")}
      />
    );
  }

  return (
    <CustomersStep
      stepIndex={stepIndex}
      totalSteps={TOTAL_STEPS}
      counts={counts}
      sampleLoading={seed.isPending}
      onSeed={() => runSeed(["customers"])}
      onFinish={() => goNext("done")}
      onBack={() => goNext("menu")}
    />
  );
}

interface MenuStepProps {
  stepIndex: number;
  totalSteps: number;
  counts: { categories: number; dishes: number; customers: number; orders: number } | undefined;
  sampleLoading: boolean;
  onSeed: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function MenuStep({ stepIndex, totalSteps, counts, sampleLoading, onSeed, onContinue, onBack }: MenuStepProps) {
  const tOnboarding = useTranslations("onboarding");
  const tErrors = useTranslations("errors");

  const cats = useCategories();
  const dishes = useDishes();
  const createCategory = useCreateCategory();
  const createDish = useCreateDish();

  const [newCategory, setNewCategory] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishPrice, setDishPrice] = useState("");

  const categories = cats.data?.items ?? [];
  const allDishes = dishes.data?.items ?? [];

  const dishesByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    const list = new Map<string, DishData[]>();

    for (const d of allDishes) {
      const cid = d.relationships.category.data.id;
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
      const arr = list.get(cid) ?? [];
      arr.push(d);
      list.set(cid, arr);
    }

    return { counts, list };
  }, [allDishes]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0]?.id ?? null);
    }
  }, [activeCategoryId, categories]);

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    try {
      const payload: CreateCategoryDTO = { name };
      const created = await createCategory.mutateAsync(payload);
      setNewCategory("");
      setActiveCategoryId(created.id);
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  const addDish = async () => {
    const name = dishName.trim();
    const eur = Number.parseFloat(dishPrice.replace(",", "."));

    if (!name || !activeCategoryId || !Number.isFinite(eur) || eur < 0) return;

    try {
      const payload: CreateDishDTO = {
        category_id: activeCategoryId,
        name,
        description: dishDescription.trim() || null,
        price_cents: Math.round(eur * 100),
      };
      await createDish.mutateAsync(payload);
      setDishName("");
      setDishDescription("");
      setDishPrice("");
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  const dishesForActive = activeCategoryId ? (dishesByCategory.list.get(activeCategoryId) ?? []) : [];

  return (
    <StepShell
      step={stepIndex}
      totalSteps={totalSteps}
      title={tOnboarding("menu.title")}
      subtitle={tOnboarding("menu.subtitle")}
      primaryLabel={tOnboarding("continue")}
      onPrimary={onContinue}
      primaryLoading={sampleLoading}
      onBack={onBack}
      sample={{
        hint: tOnboarding("menu.sampleHint"),
        onClick: onSeed,
        loading: sampleLoading,
      }}
    >
      <p className="text-[13px] text-ink-2">{tOnboarding("menu.currentDishes", { n: counts?.dishes ?? 0 })}</p>

      <div className="flex flex-col gap-2.5">
        <label className="text-[12px] uppercase tracking-[0.04em] text-ink-2">{tOnboarding("menu.addCategory")}</label>
        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.currentTarget.value)}
            placeholder={tOnboarding("menu.categoryPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="h-10 flex-1 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
          />
          <Button variant="outline" onClick={addCategory} disabled={!newCategory.trim() || createCategory.isPending}>
            {tOnboarding("menu.addBtn")}
          </Button>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c: CategoryData) => {
              const active = c.id === activeCategoryId;
              const count = dishesByCategory.counts.get(c.id) ?? 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategoryId(c.id)}
                  className={`h-8 rounded-full border px-3 text-[12px] transition-colors ${
                    active ? "border-ink bg-ink text-bg" : "border-line bg-bg text-ink-2 hover:border-line-mid"
                  }`}
                >
                  {c.attributes.name} <span className="opacity-60">· {count}</span>
                </button>
              );
            })}
          </div>

          {dishesForActive.length > 0 ? (
            <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-bg/50">
              {dishesForActive.map((dish) => (
                <DishRow key={dish.id} dish={dish} />
              ))}
            </ul>
          ) : null}

          <label className="text-[12px] uppercase tracking-[0.04em] text-ink-2">{tOnboarding("menu.addDish")}</label>
          <div className="grid grid-cols-[1fr_120px_auto] gap-2">
            <input
              value={dishName}
              onChange={(e) => setDishName(e.currentTarget.value)}
              placeholder={tOnboarding("menu.dishNamePlaceholder")}
              className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
            />
            <input
              value={dishPrice}
              onChange={(e) => setDishPrice(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && addDish()}
              inputMode="decimal"
              placeholder={tOnboarding("menu.dishPricePlaceholder")}
              className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 text-right font-mono text-[13.5px] text-ink"
            />
            <Button
              variant="outline"
              onClick={addDish}
              disabled={!dishName.trim() || !activeCategoryId || !Number.parseFloat(dishPrice) || createDish.isPending}
            >
              {tOnboarding("menu.addBtn")}
            </Button>
          </div>
          <input
            value={dishDescription}
            onChange={(e) => setDishDescription(e.currentTarget.value)}
            placeholder={tOnboarding("menu.dishDescriptionPlaceholder")}
            className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13px] text-ink"
          />
        </div>
      ) : null}
    </StepShell>
  );
}

function DishRow({ dish }: { dish: DishData }) {
  const tOnboarding = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const update = useUpdateDish();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(dish.attributes.name);
  const [description, setDescription] = useState(dish.attributes.description ?? "");
  const [priceEur, setPriceEur] = useState((dish.attributes.price_cents / 100).toFixed(2));

  useEffect(() => {
    setName(dish.attributes.name);
    setDescription(dish.attributes.description ?? "");
    setPriceEur((dish.attributes.price_cents / 100).toFixed(2));
  }, [dish.attributes.name, dish.attributes.description, dish.attributes.price_cents]);

  const save = async () => {
    const eur = Number.parseFloat(priceEur.replace(",", "."));
    if (!name.trim() || !Number.isFinite(eur) || eur < 0) return;

    const patch: UpdateDishDTO = {
      name: name.trim(),
      description: description.trim() || null,
      price_cents: Math.round(eur * 100),
    };

    try {
      await update.mutateAsync({ id: dish.id, patch });
      setEditing(false);
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  if (!editing) {
    return (
      <li className="flex items-start justify-between gap-3 px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13.5px] font-medium text-ink">{dish.attributes.name}</span>
            <span className="font-mono text-[12.5px] text-ink-2">
              {(dish.attributes.price_cents / 100).toFixed(2)} €
            </span>
          </div>
          {dish.attributes.description ? (
            <p className="mt-0.5 text-[12px] text-ink-3 line-clamp-2">{dish.attributes.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-2 hover:text-ink"
        >
          {tCommon("edit")}
        </button>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-3.5 py-3">
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          className="h-9 rounded-[8px] border border-line-mid bg-surface px-2.5 font-sans text-[13px] text-ink"
        />
        <input
          value={priceEur}
          onChange={(e) => setPriceEur(e.currentTarget.value)}
          inputMode="decimal"
          className="h-9 rounded-[8px] border border-line-mid bg-surface px-2.5 text-right font-mono text-[13px] text-ink"
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        placeholder={tOnboarding("menu.dishDescriptionPlaceholder")}
        className="h-9 rounded-[8px] border border-line-mid bg-surface px-2.5 font-sans text-[12.5px] text-ink"
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={() => setEditing(false)}>
          {tCommon("cancel")}
        </Button>
        <Button variant="ink" onClick={save} disabled={update.isPending || !name.trim()}>
          {tCommon("save")}
        </Button>
      </div>
    </li>
  );
}

interface CustomersStepProps {
  stepIndex: number;
  totalSteps: number;
  counts: { categories: number; dishes: number; customers: number; orders: number } | undefined;
  sampleLoading: boolean;
  onSeed: () => void;
  onFinish: () => void;
  onBack: () => void;
}

function CustomersStep({ stepIndex, totalSteps, counts, sampleLoading, onSeed, onFinish, onBack }: CustomersStepProps) {
  const tOnboarding = useTranslations("onboarding");
  const tErrors = useTranslations("errors");

  const customers = useCustomers({ pageSize: 5 });
  const create = useCreateCustomer();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");

  const liveCount = counts?.customers ?? customers.data?.meta?.total ?? 0;

  const submit = async () => {
    if (!first.trim() || !last.trim() || !emailOrPhone.trim()) return;

    const isEmail = emailOrPhone.includes("@");
    const payload: CreateCustomerDTO = {
      first_name: first.trim(),
      last_name: last.trim(),
      email: isEmail ? emailOrPhone.trim() : null,
      phone: isEmail ? null : emailOrPhone.trim(),
    };

    try {
      await create.mutateAsync(payload);
      setFirst("");
      setLast("");
      setEmailOrPhone("");
    } catch (err) {
      toast.error((err as Error).message ?? tErrors("generic"));
    }
  };

  return (
    <StepShell
      step={stepIndex}
      totalSteps={totalSteps}
      title={tOnboarding("customers.title")}
      subtitle={tOnboarding("customers.subtitle")}
      primaryLabel={tOnboarding("finish")}
      onPrimary={onFinish}
      primaryLoading={sampleLoading}
      onBack={onBack}
      sample={{
        hint: tOnboarding("customers.sampleHint"),
        onClick: onSeed,
        loading: sampleLoading,
      }}
    >
      <p className="text-[13px] text-ink-2">{tOnboarding("customers.currentCustomers", { n: liveCount })}</p>

      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <label className="text-[12px] uppercase tracking-[0.04em] text-ink-2">{tOnboarding("customers.add")}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={first}
            onChange={(e) => setFirst(e.currentTarget.value)}
            placeholder={tOnboarding("customers.firstPlaceholder")}
            className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
          />
          <input
            value={last}
            onChange={(e) => setLast(e.currentTarget.value)}
            placeholder={tOnboarding("customers.lastPlaceholder")}
            className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={tOnboarding("customers.contactPlaceholder")}
            className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink"
          />
          <Button
            variant="outline"
            onClick={submit}
            disabled={!first.trim() || !last.trim() || !emailOrPhone.trim() || create.isPending}
          >
            {tOnboarding("customers.addBtn")}
          </Button>
        </div>
      </div>
    </StepShell>
  );
}

interface TablesStepProps {
  stepIndex: number;
  totalSteps: number;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

function TablesStep({ stepIndex, totalSteps, onContinue, onSkip, onBack }: TablesStepProps) {
  const tOnboarding = useTranslations("onboarding");
  const tTables = useTranslations("tables");
  const tCommon = useTranslations("common");
  const tablesQ = useTables();
  const create = useCreateTable();
  const del = useDeleteTable();

  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(2);

  const items = tablesQ.data?.items ?? [];

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      await create.mutateAsync({ label: label.trim(), capacity, position: items.length });
      setLabel("");
      setCapacity(2);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const seedDefaults = async () => {
    const defaults: Array<{ label: string; capacity: number }> = [
      { label: "T1", capacity: 2 },
      { label: "T2", capacity: 2 },
      { label: "T3", capacity: 4 },
      { label: "T4", capacity: 4 },
      { label: "T5", capacity: 6 },
      { label: "Bar 1", capacity: 2 },
      { label: "Terrasse 1", capacity: 4 },
    ];
    let position = items.length;
    let inserted = 0;
    let conflicts = 0;
    for (const t of defaults) {
      try {
        await create.mutateAsync({ ...t, position: position++ });
        inserted++;
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 409) {
          conflicts++;
        } else {
          toast.error((err as Error).message);
          return;
        }
      }
    }
    if (inserted > 0) toast.success(tTables("created"));
    if (conflicts > 0 && inserted === 0) toast.info(tTables("alreadyPresent"));
  };

  return (
    <StepShell
      step={stepIndex}
      totalSteps={totalSteps}
      title={tOnboarding("tables.title")}
      subtitle={tOnboarding("tables.subtitle")}
      primaryLabel={tOnboarding("continue")}
      onPrimary={onContinue}
      secondaryLabel={tOnboarding("skip")}
      onSecondary={onSkip}
      onBack={onBack}
      sample={{ hint: tOnboarding("tables.sampleHint"), onClick: seedDefaults }}
    >
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-[13px] text-ink-3">{tTables("empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-bg/30">
            {items.map((tb) => (
              <li key={tb.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="font-sans text-[13.5px] text-ink">{tb.attributes.label}</span>
                  <span className="ml-2 text-[12px] text-ink-3">{tb.attributes.capacity} couv.</span>
                </div>
                <button
                  type="button"
                  onClick={() => del.mutate(tb.id)}
                  className="text-[11.5px] text-neg hover:underline"
                >
                  {tCommon("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onAdd} className="grid grid-cols-[1fr_88px_auto] items-end gap-2">
          <FormField
            label={tTables("col.label")}
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder={tTables("labelPlaceholder")}
          />
          <FormField
            label={tTables("col.capacity")}
            type="number"
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(Number.parseInt(e.currentTarget.value || "2", 10))}
          />
          <Button type="submit" variant="ink" disabled={!label.trim() || create.isPending}>
            +
          </Button>
        </form>
      </div>
    </StepShell>
  );
}
