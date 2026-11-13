import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Alignée sur la palette « Confiance & Assurance » de
        // community-portal (où ces pages sont réellement affichées
        // publiquement) au lieu du vert d'origine.
        ink: {
          50: "#f4f8fc",
          100: "rgba(13, 31, 51, 0.08)",
          200: "#e3edf8",
          700: "#2c4a6b",
          800: "#0d1f33",
          900: "#061428",
        },
        lagoon: {
          400: "#458fc8",
          500: "#337ab7",
          600: "#1a5276",
          700: "#0d3b6b",
        },
        sun: {
          400: "#fde68a",
          500: "#d97706",
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
