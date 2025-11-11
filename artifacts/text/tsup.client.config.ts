import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/client/index.ts"],
  outDir: "dist/client",
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: [
    "@workspace/ai",
    "@workspace/artifact",
    "@workspace/database",
    "@workspace/icons",
    "@workspace/ui",
    "framer-motion",
    "react",
    "react-dom",
    "sonner",
    "zod",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".js" : ".cjs",
  }),
});
