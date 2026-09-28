/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Anybody Variable"', '"PingFang SC"', 'sans-serif'],
        mono: ['"Atkinson Hyperlegible Mono Variable"', 'monospace'],
      },
    },
  },
  plugins: [],
}
