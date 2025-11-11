import { nextJsConfig } from "@configs/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [...nextJsConfig, { rules: {
  ...nextJsConfig.rules,
    // "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
}]
