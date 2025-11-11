import { config } from "@configs/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config} */
export default [...config, { rules: {
  ...config.rules,
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
}]
