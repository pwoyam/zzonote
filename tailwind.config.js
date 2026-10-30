/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg-primary) / <alpha-value>)',
        surface: 'rgb(var(--bg-secondary) / <alpha-value>)',
        primary: 'rgb(var(--accent) / <alpha-value>)',
        'primary-light': 'rgb(var(--accent) / 0.1)',
        text: {
          main: 'rgb(var(--content-primary) / <alpha-value>)',
          muted: 'rgb(var(--content-muted) / <alpha-value>)',
        },
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover) / <alpha-value>)',
        'border': 'rgb(var(--border) / <alpha-value>)',
        'border-soft': 'rgb(var(--border-soft) / <alpha-value>)',
        'content-primary': 'rgb(var(--content-primary) / <alpha-value>)',
        'content-secondary': 'rgb(var(--content-secondary) / <alpha-value>)',
        'content-muted': 'rgb(var(--content-muted) / <alpha-value>)',
        'accent': 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent) / 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'Vazirmatn', 'system-ui', 'sans-serif'],
        fa: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        en: ['Inter', 'Vazirmatn', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
