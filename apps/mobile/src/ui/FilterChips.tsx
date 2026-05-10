import { Pressable, ScrollView, Text } from "react-native";

export type Chip<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  options: Chip<T>[];
  value: T;
  onChange: (next: T) => void;
};

export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="button"
            onPress={() => onChange(opt.key)}
            className={`px-3 py-1.5 rounded-full border ${active ? "bg-ink border-ink" : "bg-transparent border-line-mid"}`}
          >
            <Text className={`font-sans text-[12px] ${active ? "text-bg" : "text-ink-2"}`}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
