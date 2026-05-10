import { Text, View } from "react-native";

type Props = { name: string; size?: number };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, size = 36 }: Props) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-accent-soft items-center justify-center"
    >
      <Text className="font-sans text-[12px] font-medium text-accent">{initials(name)}</Text>
    </View>
  );
}
