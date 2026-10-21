import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        primary: {
          DEFAULT: "#dc2626",
          dark: "#b91c1c",
          light: "#ef4444",
          foreground: "#ffffff",
        },
        dark: {
          DEFAULT: "#09090b",
          surface: "#18181b",
          border: "#27272a",
        },
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      fontFamily: {
        sans: ["'Prompt'", "sans-serif"],
        prompt: ["'Prompt'", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        tmrda: {
          "primary": "#dc2626",
          "secondary": "#09090b",
          "accent": "#b91c1c",
          "neutral": "#18181b",
          "base-100": "#ffffff",
          "base-200": "#f4f4f5",
          "base-300": "#e4e4e7",
          "info": "#2563eb",
          "success": "#16a34a",
          "warning": "#d97706",
          "error": "#dc2626",
        },
      },
    ],
  },
};
export default config;
