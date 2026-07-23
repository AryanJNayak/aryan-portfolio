/**
 * Tailwind CSS configuration.
 *
 * Purpose: Define the dark + blue design system (colors, fonts, animations)
 *          used across the whole portfolio. Dark mode is class-based so the
 *          theme toggle can switch it.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy backgrounds.
        night: {
          900: "#050816",
          800: "#0a0e27",
          700: "#0f1535",
          600: "#151b45",
        },
        // Electric/brand blue accents.
        brand: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk Variable"', "sans-serif"],
        body: ['"Inter Variable"', "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(56, 189, 248, 0.45)",
        card: "0 10px 40px -15px rgba(2, 6, 23, 0.8)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 40%), radial-gradient(circle at 80% 60%, rgba(56,189,248,0.12), transparent 45%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};
