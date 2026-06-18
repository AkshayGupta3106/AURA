/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: "#6B2737",
        "burgundy-dark": "#5a1f2d",
        gold: "#C4A35A",
        charcoal: "#2D2D2D",
        cream: "#FAF7F4",
        "cream-dark": "#F0E6DC",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "warm-gradient": "linear-gradient(135deg, #FAF7F4 0%, #F0E6DC 100%)",
        "burgundy-gradient": "linear-gradient(135deg, #6B2737 0%, #8B3547 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "fade-up": "fadeUp 0.5s ease forwards",
        "scale-in": "scaleIn 0.4s ease forwards",
        "spin-slow": "spin 1.5s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(107, 39, 55, 0.08)",
        "card-hover": "0 12px 40px 0 rgba(107, 39, 55, 0.12)",
      },
    },
  },
  plugins: [],
};
