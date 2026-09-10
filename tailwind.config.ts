import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          50: "#f4f7f6",
          100: "#e2ebe8",
          200: "#c5d7d1",
          700: "#2a4a42",
          800: "#1c332e",
          900: "#122420",
        },
        lagoon: {
          400: "#3db8a0",
          500: "#1f9a82",
          600: "#167a66",
          700: "#115c4d",
        },
        sun: {
          400: "#f0c14d",
          500: "#e2a820",
        },
      },
      fontFamily: {
        sans: ["var(--font-cms-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-cms-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
