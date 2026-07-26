import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#fafafa",
        // A single neutral accent used sparingly (labels, active states,
        // hover underlines) instead of a color — keeps the whole site
        // strictly black/white/gray, matching the reference direction.
        graphite: {
          DEFAULT: "#3f3f3f",
          light: "#6b6b6b",
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
