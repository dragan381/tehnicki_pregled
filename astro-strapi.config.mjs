// Astro configuration with Strapi integration

import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [tailwind()],
  site: "https://dragan381.github.io",
  base: process.env.GITHUB_ACTIONS ? "/tehnicki_pregled" : "/",
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
  // Enable static generation with revalidation support
  output: "static",
  // Optional: Add incremental static regeneration (ISR) if needed
  // output: 'hybrid',
});
