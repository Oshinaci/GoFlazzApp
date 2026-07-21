import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        background: "#05070D",
        surface: "#0B0F1A",
        "surface-glass": "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
          50: "#EFF6FF",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        accent: {
          DEFAULT: "#6366F1",
          glow: "#22D3EE",
        },
        muted: {
          DEFAULT: "#151A26",
          foreground: "#8B93A7",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        logo: ["'Noto Sans SC'", "'PingFang SC'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow: "0 0 40px rgba(59,130,246,0.25)",
      },
      backgroundImage: {
        "blue-gradient": "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #22D3EE 100%)",
        "surface-gradient": "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
