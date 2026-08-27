/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgMain: "#07111f",
        panelBg: "#0c1d31",
        panel2Bg: "#102b48",
      },
    },
  },
  plugins: [],
}

