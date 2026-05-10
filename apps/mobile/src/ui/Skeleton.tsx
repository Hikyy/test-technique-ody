import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

type Props = { className?: string; height?: number; width?: number | string };

export function Skeleton({ className, height = 14, width }: Props) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[{ height, width: (width as number | undefined) ?? "100%" }, { opacity }]}>
      <View className={`bg-accent-soft rounded-sm h-full w-full ${className ?? ""}`} />
    </Animated.View>
  );
}
