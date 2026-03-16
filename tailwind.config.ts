import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          plum: "#5B2A86",
          "plum-dark": "#4A2270",
          iris: "#7C5CFF",
          "iris-dark": "#6B4BE6",
          "iris-light": "#EDE9FE",
          cyan: "#22C7F2",
        },
        dp: {
          bg: "#FCFAFF",
          surface: "#FFFFFF",
          "surface-alt": "#F4EFFA",
          border: "#E8DFF0",
          "text-primary": "#1F1630",
          "text-secondary": "#5E5570",
          "text-muted": "#8A8198",
          success: "#1F9D55",
          "success-bg": "#D1FAE5",
          warning: "#D97706",
          "warning-bg": "#FEF3C7",
          error: "#D64545",
          "error-bg": "#FEE2E2",
          info: "#3B82F6",
          "info-bg": "#E0F2FE",
        },
      },
      fontFamily: {
        ar: ["var(--font-cairo)", "sans-serif"],
        he: ["var(--font-heebo)", "sans-serif"],
        en: ["var(--font-ubuntu)", "sans-serif"],
        sans: ["var(--font-primary)", "sans-serif"],
      },
      boxShadow: {
        raised: "0 1px 3px rgba(31, 22, 48, 0.08)",
        card: "0 4px 6px -1px rgba(31, 22, 48, 0.06), 0 2px 4px -2px rgba(31, 22, 48, 0.04)",
        overlay:
          "0 10px 15px -3px rgba(31, 22, 48, 0.08), 0 4px 6px -4px rgba(31, 22, 48, 0.04)",
        modal:
          "0 20px 25px -5px rgba(31, 22, 48, 0.08), 0 8px 10px -6px rgba(31, 22, 48, 0.04)",
      },
      borderRadius: {
        card: "12px",
        "card-sm": "8px",
        "card-lg": "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-plum":
          "linear-gradient(135deg, #5B2A86 0%, #7C5CFF 50%, #22C7F2 100%)",
        "gradient-iris":
          "linear-gradient(135deg, #7C5CFF 0%, #6B4BE6 100%)",
        "gradient-hero":
          "linear-gradient(135deg, #1F1630 0%, #5B2A86 40%, #7C5CFF 80%, #22C7F2 100%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(124,92,255,0.08) 50%, transparent 100%)",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
