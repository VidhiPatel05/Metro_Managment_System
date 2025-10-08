/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'metro-blue': '#003f88',
        'sky-blue': '#007bff',
        'metro-orange': '#ff6f00',
        'metro-green': '#2ecc71',
        'light-grey': '#f5f5f5',
        'admin-charcoal': '#121212',
        'admin-blue': '#2196f3',
        'admin-teal': '#26a69a',
        'admin-white': '#e0e0e0',
        'admin-grey': '#9e9e9e',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}