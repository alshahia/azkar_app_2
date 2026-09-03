
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        accent: {
          DEFAULT: '#f59e0b', // Amber/Gold
          light: '#fcd34d',
          dark: '#b45309',
        },
        sand: {
          50: '#fafaf9', // Warm Sand Background
          100: '#f5f5f4',
          200: '#e7e5e4',
        },
        midnight: {
          800: '#111827',
          900: '#022c22', // Deep Midnight Forest
          950: '#011c16', // Darkest Background
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Amiri"', 'ui-serif', 'Georgia', 'serif'],
        quran: ['"Amiri Quran"', '"Scheherazade New"', '"Amiri"', 'serif'],
      }
    }
  },
  plugins: [],
}
