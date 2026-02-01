// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: process.env.SITE_URL || "https://dragan381.github.io",
  base: process.env.BASE_PATH || "/",
});
