import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 77 pre-existing `any`s remain (mostly admin pages and entity-helpers).
    // Warn so CI can gate on real errors; make it "error" once they're typed.
    // Don't add new ones.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Every client page fetches in useEffect and sets loading state there.
      // Server-rendering the public pages removes most of these; until
      // then, warn instead of failing CI.
      "react-hooks/set-state-in-effect": "warn",
      // Unused code is an error; prefix a name with _ to discard it on purpose.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
