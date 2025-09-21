import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "@svgr/rollup";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svgr(), react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
