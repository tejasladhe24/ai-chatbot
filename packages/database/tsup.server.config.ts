import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server/index.ts"],
  outDir: "dist/server",
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  external: ["drizzle-orm", "@workspace/di"],
  clean: true,
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".js" : ".cjs",
  }),
});
