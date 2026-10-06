import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#07070b', soft: '#0b0b12', card: '#0f0f18' },
        line:    'rgba(255,255,255,0.08)',
        ink:     { DEFAULT: '#e7e7ee', muted: '#8a8a9a', faint: '#55556a' },
        accent:  { DEFAULT: '#7c6df2', soft: '#9b8ffa', glow: '#4c3fd6' },
        cyan:    { DEFAULT: '#59d8ff' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(1200px 600px at 50% -10%, rgba(124,109,242,0.25), transparent 60%)',
        'grid': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      animation: {
        'fade-in': 'fadeIn .4s ease-out',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
export default config;
