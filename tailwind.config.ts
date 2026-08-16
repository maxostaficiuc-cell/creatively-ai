import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0A0A0D",
          surface: "#111114",
          card: "#15151A",
          border: "#242429",
        },
        brand: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        accent: {
          green: "#22C55E",
          red: "#EF4444",
        },
        ink: {
          primary: "#F5F5F7",
          secondary: "#9A9AA5",
          muted: "#6B6B75",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(139, 92, 246, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
