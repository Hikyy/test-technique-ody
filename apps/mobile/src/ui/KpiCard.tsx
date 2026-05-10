import { Text, View } from "react-native";
import { Sparkline } from "./Sparkline";

type Props = {
  label: string;
  value: string;
  delta?: string;
  points: number[];
};

export function KpiCard({ label, value, delta, points }: Props) {
  return (
    <View className="bg-surface rounded-card border border-line p-4">
      <Text className="font-sans text-[10.5px] uppercase tracking-wider text-ink-2">{label}</Text>
      <Text className="mt-2 font-sans text-[26px] font-medium tracking-tight text-ink">{value}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Sparkline points={points} width={76} height={18} color="#5b6e4f" />
        {delta ? <Text className="font-mono text-[10px] text-accent">{delta}</Text> : null}
      </View>
    </View>
  );
}
