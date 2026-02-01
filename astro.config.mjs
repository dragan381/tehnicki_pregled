// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: "https://dragan381.github.io",
  // base will be automatically set by GitHub Actions from steps.pages.outputs.base_path
});
