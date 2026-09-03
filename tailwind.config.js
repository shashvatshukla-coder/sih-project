/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C3D7EB',
          300: '#96BCE0',
          400: '#649ED1',
          500: '#3D80C0',
          600: '#2A64A0',
          700: '#1F4D7E',
          800: '#193F67',
          900: '#0F253E',
          950: '#0A1828',
        },
        agri: {
          50: '#F2F9F3',
          100: '#E1F2E4',
          500: '#2E8540',
          600: '#236932',
          700: '#1B5226',
        },
        forest: {
          500: '#15803D',
        },
        urban: {
          500: '#475569',
        },
        water: {
          500: '#0284C7',
        },
        barren: {
          500: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
