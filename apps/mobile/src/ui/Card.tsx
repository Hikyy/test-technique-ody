import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

type Props = ViewProps & {
  children: ReactNode;
};

export function Card({ children, className, style, ...rest }: Props & { className?: string }) {
  return (
    <View style={style} className={`bg-surface rounded-card border border-line p-4 ${className ?? ""}`} {...rest}>
      {children}
    </View>
  );
}
