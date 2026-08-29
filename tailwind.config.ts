import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#4F6EF7',
          dark: '#6C7FF0',
        },
        bg: '#EEF0FA',
        ink: {
          DEFAULT: '#1A1A2E',
          soft: '#8A8FA3',
        },
        success: {
          DEFAULT: '#22C55E',
          bg: '#E8F9EF',
        },
        warning: {
          DEFAULT: '#F5A623',
          bg: '#FEF3E2',
        },
        danger: {
          DEFAULT: '#F4645A',
          bg: '#FDECEC',
        },
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
