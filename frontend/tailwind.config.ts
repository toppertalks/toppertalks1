import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        ayar: {
          bg: "#09090b",
          primary: "#FF0055"
        }
      },
      borderRadius: {
        "2xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;

