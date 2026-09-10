
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
        // Tajweed-colored variant of the same Uthmani font. Switching to this
        // family on the same Uthmani text paints the embedded Tajweed rules
        // via OpenType color glyphs (no per-character markup needed).
        'quran-colored': ['"Amiri Quran Colored"', '"Amiri Quran"', '"Scheherazade New"', '"Amiri"', 'serif'],
      },
      // One-shot "gentle bounce" promised by DESIGN.md (Components → Completion Card → Hero element).
      // Replaces the 800ms spring overshoot reserved for the larger completion transition;
      // expo-out keeps the landing calm so the moment reads as a thank-you, not a snap.
      keyframes: {
        'bounce-short': {
          '0%':   { transform: 'translateY(0)' },
          '40%':  { transform: 'translateY(-10px)' },
          '70%':  { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(0)' },
        },
        // 120ms +1 micro-feedback for the ZikrCard counter chip. The chip
        // briefly scales up and tints to confirm the tap registered,
        // then settles back without lingering color so it doesn't compete
        // with the next tap.
        'counter-pulse': {
          '0%':   { transform: 'scale(1)',    color: 'inherit' },
          '40%':  { transform: 'scale(1.12)', color: 'rgb(16 185 129)' },
          '100%': { transform: 'scale(1)',    color: 'inherit' },
        },
        // Fade-in for modals and explanatory cards (EditZikrModal,
        // ExplainZikrModal, HomeScreen widgets). One-shot, 300ms —
        // long enough to read as intentional, short enough not to delay.
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Fade-in-up for widgets that should arrive gently (8px lift).
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slower pulse for ambient highlights (ExplainZikrModal
        // decorative halo). 2.5s with a softer opacity dip so it never
        // reads as urgent.
        'pulse-slow': {
          '0%':   { opacity: '1' },
          '50%':  { opacity: '0.55' },
          '100%': { opacity: '1' },
        },
        // Slide-down for the offline indicator — top-anchored announcement
        // that should reveal from above without competing with content.
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slide-up-mobile — bottom-anchored entrance for the AI explain
        // sheet. 20px lift is enough to read as motion without becoming
        // a gesture-disrupting jump.
        'slide-up-mobile': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'bounce-short':     'bounce-short 700ms cubic-bezier(0.22, 1, 0.36, 1) 1',
        'counter-pulse':    'counter-pulse 120ms cubic-bezier(0.22, 1, 0.36, 1) 1',
        'fade-in':          'fade-in 300ms ease-out 1',
        'fade-in-up':       'fade-in-up 350ms cubic-bezier(0.22, 1, 0.36, 1) 1',
        'pulse-slow':       'pulse-slow 2.5s ease-in-out infinite',
        'slide-down':       'slide-down 250ms cubic-bezier(0.22, 1, 0.36, 1) 1',
        'slide-up-mobile':  'slide-up-mobile 300ms cubic-bezier(0.22, 1, 0.36, 1) 1',
      },
    }
  },
  plugins: [],
}
