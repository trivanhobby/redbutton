/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'redbutton': '#EF4444',
        'greenbutton': '#22C55E',
        'primary': '#3E63DD',
        'secondary': '#F43F5E',
        'background': '#09090B',
        'surface': '#111827',
        'muted': '#374151',
        'card': '#1F2937',
        'border': '#374151',
        'ring': '#3E63DD',
        'error': '#EF4444',
        'success': '#22C55E',
        'warning': '#F59E0B',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} 