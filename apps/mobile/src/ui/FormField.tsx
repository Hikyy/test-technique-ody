import { type ComponentProps, forwardRef } from "react";
import { Text, TextInput, View } from "react-native";

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

export const FormField = forwardRef<TextInput, Props>(function FormField({ label, error, ...rest }, ref) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans text-[12px] uppercase tracking-wider text-ink-2">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="rgba(21,20,15,0.42)"
        className="bg-surface rounded-card border border-line-mid px-3.5 py-3 font-sans text-[14px] text-ink"
        {...rest}
      />
      {error ? <Text className="font-sans text-[12px] text-neg">{error}</Text> : null}
    </View>
  );
});
