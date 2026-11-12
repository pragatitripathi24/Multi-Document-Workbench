/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A2540',
          50: '#E8EEF4',
          100: '#D1DDE9',
          200: '#A3BBD3',
          300: '#7599BD',
          400: '#4777A7',
          500: '#0A2540',
          600: '#081E33',
          700: '#061626',
          800: '#040F1A',
          900: '#02070D',
        },
        indigo: {
          DEFAULT: '#635BFF',
          50: '#EFEEFF',
          100: '#DFDDFF',
          200: '#BFBBFF',
          300: '#9F99FF',
          400: '#7F77FF',
          500: '#635BFF',
          600: '#4F49CC',
          700: '#3B3799',
          800: '#282466',
          900: '#141233',
        },
        surface: {
          DEFAULT: '#F6F9FC',
          card: '#FFFFFF',
          border: '#E6EBF1',
          muted: '#697386',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        elevated:
          '0 4px 16px rgba(16, 24, 40, 0.08), 0 1px 3px rgba(16, 24, 40, 0.06)',
        focus: '0 0 0 3px rgba(99, 91, 255, 0.25)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
