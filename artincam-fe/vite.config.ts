import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@providers": path.resolve(__dirname, "./src/providers"),
      "@reducers": path.resolve(__dirname, "./src/reducers"),
      "@theme": path.resolve(__dirname, "./src/theme"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@helpers": path.resolve(__dirname, "./src/helpers"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@root": path.resolve(__dirname, "./src"),
      // Add more aliases as needed
    },
  },
});
