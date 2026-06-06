/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        gold: {
          DEFAULT: '#C89B3C',
          dark: '#A87E2A',
          light: '#D8B864',
        },
        beige: '#D8C7B5',
        cream: '#F4EFE8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
        wide2: '0.18em',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(17, 17, 17, 0.18)',
        card: '0 8px 30px -10px rgba(17, 17, 17, 0.15)',
        gold: '0 8px 30px -8px rgba(200, 155, 60, 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
