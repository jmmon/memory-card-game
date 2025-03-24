/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        // "inner": "inset 0 2px 4px 0 rgb(0, 0, 0, 0.05);",
        "inner-2": "inset 0 2px 4px 0 rgb(0, 0, 0, 0.05), inset 0px -4px 8px -2px rgba(0, 0, 0, 0.1)",
      }
    },
  },
  plugins: [],
};
