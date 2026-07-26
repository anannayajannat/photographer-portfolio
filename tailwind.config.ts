import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // RGB-channel-list custom properties (not plain hex) — this is
        // what lets Tailwind's opacity modifiers (text-ink/50, bg-ink/5,
        // etc, used throughout the site) keep working, since Tailwind
        // needs `rgb(var(--x) / <alpha-value>)` to slot the alpha in.
        // The actual light/dark values live in globals.css under :root
        // and .dark — swapping those two blocks is the entire dark mode
        // implementation; no component needs a `dark:` variant.
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        graphite: {
          DEFAULT: "rgb(var(--color-graphite) / <alpha-value>)",
          light: "rgb(var(--color-graphite-light) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
