/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13231e",
        forest: { 50: "#effaf5", 100: "#d9f2e6", 500: "#16815f", 600: "#0f6b4f", 700: "#0c5a43", 900: "#12372b" },
        amber: { 50: "#fff9e8", 100: "#fff0bd", 500: "#e5a30f", 700: "#9a6500" },
        danger: { 50: "#fff3f1", 100: "#ffe0dc", 500: "#dc594b", 700: "#a43128" },
        tech: { 50: "#eef7ff", 100: "#d9edff", 500: "#2a84c6", 700: "#165f93" }
      },
      boxShadow: {
        soft: "0 12px 34px rgba(18, 55, 43, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      }
    }
  },
  plugins: []
};
