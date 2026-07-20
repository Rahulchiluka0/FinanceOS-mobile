/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#e8eef6',
        elevated: '#f4f7fb',
        surface: '#ffffff',
        ink: '#0b1220',
        soft: '#334155',
        muted: '#64748b',
        brand: {
          DEFAULT: '#1a56db',
          hover: '#1546b8',
          soft: '#dce7fb',
        },
        accent: '#ea580c',
        danger: '#dc2626',
        success: '#0284c7',
        warning: '#d97706',
      },
      fontFamily: {
        display: ['System'],
        body: ['System'],
      },
      borderRadius: {
        card: '12px',
        sm: '8px',
        lg: '18px',
      },
    },
  },
  plugins: [],
}
