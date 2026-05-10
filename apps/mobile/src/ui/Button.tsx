import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type PressableProps, Text } from "react-native";

type Variant = "primary" | "ghost" | "destructive" | "ink";

type Props = Omit<PressableProps, "children"> & {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-accent active:opacity-80",
  ghost: "bg-transparent border border-line-mid active:opacity-70",
  destructive: "bg-neg active:opacity-80",
  ink: "bg-ink active:opacity-80",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-bg",
  ghost: "text-ink",
  destructive: "text-bg",
  ink: "text-bg",
};

export function Button({ children, variant = "primary", loading, disabled, ...rest }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`h-11 rounded-card items-center justify-center px-4 ${containerByVariant[variant]} ${isDisabled ? "opacity-60" : ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "ghost" ? "#15140f" : "#fbfaf6"} />
      ) : (
        <Text className={`font-sans text-[14px] font-medium ${textByVariant[variant]}`}>{children}</Text>
      )}
    </Pressable>
  );
}
