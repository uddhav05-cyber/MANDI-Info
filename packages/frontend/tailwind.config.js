/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#FF9933',
        'deep-green': '#138808',
        terracotta: '#D2691E',
        'golden-yellow': '#FFD700',
      },
      fontFamily: {
        mukta: ['Mukta', 'sans-serif'],
        hind: ['Hind', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
