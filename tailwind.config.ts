import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc5fd',
          400: '#36a9fa',
          500: '#0c8eeb',
          600: '#006fc9',
          700: '#0159a3',
          800: '#064b86',
          900: '#0b3f6f',
          950: '#07284a',
        },
      },
    },
  },
  plugins: [],
};
export default config;
