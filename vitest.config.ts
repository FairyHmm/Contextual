import glsl from "vite-plugin-glsl";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [glsl()],
  test: {
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
