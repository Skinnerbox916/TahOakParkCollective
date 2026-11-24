import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // ~100 pre-existing `any`s, mostly in code the entity write-service
    // refactor will replace. Warn so CI can gate on real errors; tighten
    // back to "error" once that refactor lands.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Every client page fetches in useEffect and sets loading state there.
      // Server-rendering the public pages removes most of these; until
      // then, warn instead of failing CI.
      "react-hooks/set-state-in-effect": "warn",
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
