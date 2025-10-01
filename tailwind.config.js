/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0072c6",
        secondary: "#00a2ff",
      },
    },
  },
  plugins: [],
}