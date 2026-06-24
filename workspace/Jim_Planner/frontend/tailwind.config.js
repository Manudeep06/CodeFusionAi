/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#16A34A',
        'dark-green': '#15803D',
        'light-mint': '#ECFDF5',
        'card-bg': '#FFFFFF',
        'border-color': '#E5E7EB',
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
        'button-blue': '#2563EB',
        'warning': '#F59E0B',
        'red-remove': '#DC2626',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 25px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
