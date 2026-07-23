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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        card: "var(--surface)",
        "card-secondary": "var(--surface-secondary)",
        "surface-glass": "var(--surface-glass)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary-accent)",
          foreground: "#FFFFFF",
          50: "#EFF6FF",
          400: "#60A5FA",
          500: "#4F7DFF",
          600: "#3B62F6",
          700: "#2542E5",
        },
        accent: {
          DEFAULT: "var(--primary-accent)",
          glow: "#5B8CFF",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        logo: ["'ZCOOL QingKe HuangYou'", "'ZCOOL KuaiLe'", "'Ma Shan Zheng'", "'Noto Sans SC'", "sans-serif"],
        chinese: ["'ZCOOL QingKe HuangYou'", "'ZCOOL KuaiLe'", "'Ma Shan Zheng'", "'Noto Sans SC'", "sans-serif"],
        chineseCalligraphy: ["'Ma Shan Zheng'", "'Zhi Mang Xing'", "'Noto Sans SC'", "serif"],
        chineseDisplay: ["'ZCOOL QingKe HuangYou'", "'ZCOOL KuaiLe'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
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
