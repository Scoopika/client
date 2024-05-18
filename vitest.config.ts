import { defineConfig } from "vitest/config";
import { config } from "dotenv";

export default defineConfig({
  root: "./tests/",
  esbuild: {
    tsconfigRaw: "{}",
  },
  test: {
    clearMocks: true,
    globals: true,
    env: {
      ...config({ path: "./.env" }).parsed,
    },
  },
});
