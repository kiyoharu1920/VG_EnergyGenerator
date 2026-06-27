import nextConfig from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["outputs/**"],
  },
  ...nextConfig,
  ...nextTypescript,
];

export default eslintConfig;
