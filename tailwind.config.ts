import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        terracotta: {
          50: "#fef3ed", 100: "#fde3d2", 200: "#fac4a4", 300: "#f69c6b", 400: "#f17a3f",
          500: "#ec5a1a", 600: "#dd4110", 700: "#b72f10", 800: "#922715", 900: "#762314",
        },
        earth: {
          50: "#f7f5f0", 100: "#ece8dd", 200: "#dbd3be", 300: "#c5b799", 400: "#b29d7a",
          500: "#a48b65", 600: "#977858", 700: "#7d614a", 800: "#685141", 900: "#574438",
        },
      },
      fontFamily: { sans: ["'Outfit'", "system-ui", "sans-serif"] },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
