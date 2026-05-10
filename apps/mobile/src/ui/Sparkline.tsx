import Svg, { Path } from "react-native-svg";

type Props = {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
};

export function Sparkline({ points, width = 80, height = 22, color = "#5b6e4f", fill }: Props) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const xs = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const d = xs.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillD = `${d} L${width},${height} L0,${height} Z`;
  return (
    <Svg width={width} height={height}>
      {fill ? <Path d={fillD} fill={fill} /> : null}
      <Path d={d} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
