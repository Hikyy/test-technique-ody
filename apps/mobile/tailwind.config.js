/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#fbfaf6",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#15140f",
          2: "rgba(21,20,15,0.62)",
          3: "rgba(21,20,15,0.42)",
          4: "rgba(21,20,15,0.22)",
        },
        accent: {
          DEFAULT: "#5b6e4f",
          soft: "#e9ebe2",
          tint: "rgba(91,110,79,0.10)",
        },
        pos: "#3f6b3a",
        neg: "#a14a3a",
        warn: {
          DEFAULT: "#c98a4a",
          soft: "#fdf0e3",
          ink: "#9c4d1f",
        },
        line: {
          DEFAULT: "rgba(20,20,18,0.06)",
          mid: "rgba(20,20,18,0.10)",
          strong: "rgba(20,20,18,0.14)",
        },
      },
      borderRadius: {
        card: 12,
        sm: 7,
      },
      fontFamily: {
        sans: ["Geist", "System"],
        serif: ["InstrumentSerif", "Times New Roman"],
        mono: ["GeistMono", "Menlo"],
      },
    },
  },
  plugins: [],
};
