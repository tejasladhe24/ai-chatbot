import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server/index.ts"],
  outDir: "dist/server",
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  external: ["@workspace/di", "@workspace/ai", "@workspace/artifact", "zod"],
  clean: true,
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".js" : ".cjs",
  }),
});
