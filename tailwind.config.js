/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--bg-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--bg-tertiary) / <alpha-value>)",
          hover: "rgb(var(--bg-hover) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          soft: "rgb(var(--border-soft) / <alpha-value>)",
        },
        content: {
          primary: "rgb(var(--content-primary) / <alpha-value>)",
          secondary: "rgb(var(--content-secondary) / <alpha-value>)",
          muted: "rgb(var(--content-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
