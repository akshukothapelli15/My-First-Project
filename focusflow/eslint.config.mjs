import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends("next/core-web-vitals"),
  { rules: { "@next/next/no-html-link-for-pages": "off", "react/no-unescaped-entities": "off", "react-hooks/exhaustive-deps": "off" } },
];
