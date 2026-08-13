import { defineConfig } from "./frontend/node_modules/vitest/dist/config.js";
import react from "./frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./frontend", import.meta.url)),
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
});
