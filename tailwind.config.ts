import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Times New Roman"', "Times", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
