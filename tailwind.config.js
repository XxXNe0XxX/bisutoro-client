/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        lusitana: ["var(--font-lusitana)", "sans-serif"],
        istokWeb: ["var(--font-istok)", "sans-serif"],
        oswald: ["var(--font-oswald)", "sans-serif"],
      },
      colors: {
        brand: {
          primary: "var(--primary)",
          secondary: "var(--secondary)",
          accent: "var(--color-accent)",
          info: "var(--color-info)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)",
        },
      },
    },
  },
  plugins: [],
};
