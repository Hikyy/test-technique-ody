import Svg, { Path } from "react-native-svg";

export type TabKey = "home" | "orders" | "customers" | "menu" | "notifications";

const PATHS: Record<TabKey, string> = {
  home: "M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z",
  orders: "M5 6h14v14H5zM9 4v4M15 4v4M5 11h14",
  customers: "M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 21c.6-3 3-5 6-5s5.4 2 6 5",
  menu: "M5 5h14v6H5zM5 13h14v6H5z",
  notifications: "M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16zM10 21a2 2 0 0 0 4 0",
};

type Props = { name: TabKey; color: string; size?: number };

export function TabIcon({ name, color, size = 22 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
