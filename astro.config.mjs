// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
// base and site are automatically configured by GitHub Actions
export default defineConfig({
  integrations: [tailwind()],
  site: "https://dragan381.github.io",
});
