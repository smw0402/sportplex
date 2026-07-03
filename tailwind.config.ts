import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec3ff",
          400: "#59a2ff",
          500: "#327dff",
          600: "#1b5cf5",
          700: "#1647e1",
          800: "#193bb6",
          900: "#1a378f",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
