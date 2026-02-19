// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
// In GitHub Actions: site and base are set via environment
// In local development: site is used as-is, base defaults to "/"
export default defineConfig({
  integrations: [tailwind()],
  site: "https://dragan381.github.io",
  base: process.env.GITHUB_ACTIONS ? "/tehnicki_pregled" : "/",
  trailingSlash: "ignore",
  output: "static",
  image: {
    remotePatterns: [{ protocol: "http" }, { protocol: "https" }],
  },
});
