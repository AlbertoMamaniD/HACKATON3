import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
          if (id.includes("zod") || id.includes("react-hook-form")) return "forms";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    css: true,
    globals: true,
  },
});
