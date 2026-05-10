import { Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface ScopeOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string = string> {
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  scopes?: readonly ScopeOption<T>[];
  scope?: T;
  onScopeChange?: (scope: T) => void;
}

export function SearchBar<T extends string = string>({
  value,
  onChangeText,
  placeholder = "Rechercher…",
  scopes,
  scope,
  onScopeChange,
}: Props<T>) {
  const showScopeButton = scopes && scope && onScopeChange;
  const activeScope = scopes?.find((s) => s.key === scope);

  const handleScopeToggle = () => {
    if (!scopes || !scope || !onScopeChange) return;

    const idx = scopes.findIndex((s) => s.key === scope);
    const next = scopes[(idx + 1) % scopes.length];

    if (next) onScopeChange(next.key);
  };

  return (
    <View className="flex-row items-center gap-2 rounded-card border border-line-mid bg-surface pl-3.5 pr-1.5 h-12">
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={11} cy={11} r={7} stroke="#15140f" strokeOpacity={0.5} strokeWidth={1.7} />
        <Path d="m20 20-3.5-3.5" stroke="#15140f" strokeOpacity={0.5} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(21,20,15,0.42)"
        className="flex-1 font-sans text-[14px] text-ink h-full"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
      />

      {showScopeButton && activeScope ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filtre actif : ${activeScope.label}. Toucher pour changer.`}
          onPress={handleScopeToggle}
          className="h-9 px-3 rounded-card bg-accent-soft items-center justify-center active:opacity-70"
        >
          <Text className="font-sans text-[11.5px] uppercase tracking-wider text-accent">{activeScope.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
