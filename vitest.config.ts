/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["core/tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["core/tests", "cli", "docs"],
    },
  },
});
