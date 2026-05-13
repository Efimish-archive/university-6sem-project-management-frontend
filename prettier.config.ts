import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

export default {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "src/index.css",
  tailwindFunctions: ["clsx", "twMerge", "cva", "cn"],
} satisfies Config & PluginOptions;
