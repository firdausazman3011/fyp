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
        primary: "#E7717D",
        secondary: "#AFD275",
        mainBg: "#F9FAFB",
        cardBg: "#FFFFFF",
        textPrimary: "#2D2D2D",
        textSecondary: "#6B7280",
        borderUi: "#E5E7EB",
        sidebar: "#7E685A",
        statusApproved: "#AFD275",
        statusPending: "#FFE8A3",
        statusRejected: "#E7717D",
      },
      boxShadow: {
        card: "0 20px 45px -28px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
