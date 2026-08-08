/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'df-bg': '#f3f4f6', // gray-100
        'df-panel': '#ffffff', // white
        'df-primary-dark': '#000d36', // dark blue
        'df-primary': '#0050d2', // medium blue
        'df-primary-hover': '#0040a8', 
        'df-accent': '#00c0db', // cyan
        'df-text': '#1f2937', // gray-800
        'df-text-muted': '#6b7280', // gray-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
