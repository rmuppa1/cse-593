/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#f1f8f6', 100: '#dceee9', 500: '#267c6c', 600: '#1c675a', 700: '#175248', 800: '#153f39', 900: '#12342f' },
        coral: { 50: '#fff4ef', 100: '#ffe5d8', 500: '#e86f51', 600: '#d95535' },
        sand: '#f6f3ed',
        ink: '#18302c',
      },
      boxShadow: { soft: '0 18px 50px rgba(18,52,47,.09)', lift: '0 14px 35px rgba(18,52,47,.14)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], display: ['Georgia', 'ui-serif', 'serif'] },
    },
  },
  plugins: [],
};

