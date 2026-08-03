/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'df-bg': '#0f172a', // slate-900
        'df-panel': '#1e293b', // slate-800
        'df-primary': '#6366f1', // indigo-500
        'df-primary-hover': '#4f46e5', // indigo-600
        'df-accent': '#10b981', // emerald-500
        'df-text': '#f8fafc', // slate-50
        'df-text-muted': '#94a3b8', // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
