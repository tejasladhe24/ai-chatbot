import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/common/index.ts"],
  outDir: "dist/common",
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ["drizzle-orm"],
  outExtension: ({ format }) => ({
    js: format === "esm" ? ".js" : ".cjs",
  }),
});
