/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#0A0A0A',
          white: '#FAFAFA',
          gray: {
            50:  '#F8F8F8',
            100: '#F0F0F0',
            200: '#E0E0E0',
            400: '#9A9A9A',
            600: '#5A5A5A',
            800: '#2A2A2A',
          },
          green: '#1A7A4A', // subtle accent for ΜΕΔΣΚ badges etc
        }
      }
    },
  },
  plugins: [],
}
