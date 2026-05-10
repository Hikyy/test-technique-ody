import { Text, View } from "react-native";

type Props = { title: string; subtitle?: string };

export function EmptyState({ title, subtitle }: Props) {
  return (
    <View className="items-center px-6 py-10">
      <Text className="font-serif italic text-[22px] text-accent">{title}</Text>
      {subtitle ? <Text className="mt-2 text-center font-sans text-[13px] text-ink-2">{subtitle}</Text> : null}
    </View>
  );
}
