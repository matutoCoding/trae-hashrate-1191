/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          500: '#254E82',
          600: '#1D4170',
          700: '#17375C',
          800: '#112D4E',
          900: '#0C2340',
        },
        gold: {
          300: '#E0D0A8',
          400: '#D4BC8A',
          500: '#C9A96E',
        },
        ocean: {
          400: '#38BDF8',
          500: '#0EA5E9',
        },
        foam: {
          50: '#F5F7FA',
          100: '#EDF0F5',
          200: '#D8DDE6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
