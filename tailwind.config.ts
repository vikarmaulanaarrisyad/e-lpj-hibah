import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#065F46",    // Dark Green - Main actions, headers, active states
          secondary: "#047857",  // Medium Green - Secondary actions
          tertiary: "#D97706",   // Amber/Orange - Warnings, revisions, soft actions
          neutral: "#0F172A",    // Dark Slate - Headings, dark mode elements
          surface: "#1E293B",    // Slate 800 - Card surfaces
          surfaceBorder: "#334155", // Slate 700 - Borders
          darker: "#0B1120",     // Deeper background
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(6, 95, 70, 0.4)",
        "glow-amber": "0 0 25px -5px rgba(217, 119, 6, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
