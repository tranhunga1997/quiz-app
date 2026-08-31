import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
          text: 'rgb(var(--color-accent-text) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        success: {
          DEFAULT: '#22C55E',
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
          text: '#15803D',
        },
        warning: {
          DEFAULT: '#F5A623',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: '#F4645A',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
          text: '#C0392F',
        },
        track: 'rgb(var(--color-track) / <alpha-value>)',
      },
      borderRadius: {
        card: '20px',
        control: '12px',
        badge: '8px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(27,37,89,0.08)',
        accent: '0 4px 12px rgba(79,110,247,0.35)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
