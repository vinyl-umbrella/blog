/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      body: [
        'system-ui',
        'Arial',
        'Helvetica',
        "'Hiragino Sans'",
        "'Hiragino Kaku Gothic ProN'",
        "'Meiryo,sans-serif'",
        'sans-serif',
      ],
    },
    extend: {},
  },
  plugins: [],
};
