/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { ink: '#20231f', paper: '#f5f4ef', muted: '#777b72', line: '#e5e4dc', safety: '#f36b35', forest: '#34483d' },
    fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'] },
    boxShadow: { soft: '0 18px 50px rgba(32,35,31,.08)' }
  }},
  plugins: []
}