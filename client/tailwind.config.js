/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    // Inkwell responsive breakpoint scale — Phase K Step 1
    // These are decision zones, not the only widths that matter.
    // Fluid clamp() values (Phase K Step 2+) fill the gaps between them.
    screens: {
      xs:  '0px',
      sm:  '480px',
      md:  '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Deep indigo accent — Inkwell's signature (distinct from Medium green)
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        ink: {
          DEFAULT: "#242424",
          soft: "#6b6b6b",
          faint: "#a3a3a3",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "Cambria", "serif"],
      },
      maxWidth: {
        reading: "680px",
        feed: "728px",
      },
      keyframes: {
        clap: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        clap: "clap 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
