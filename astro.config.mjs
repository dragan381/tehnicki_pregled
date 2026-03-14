// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: isVercel
    ? process.env.SITE_URL || 'https://tehnicki-pregled.vercel.app'
    : 'https://dragan381.github.io',
  base: process.env.GITHUB_ACTIONS ? '/tehnicki_pregled' : '/',
  trailingSlash: 'ignore',
  output: 'static',
  ...(isVercel && { adapter: vercel() }),
  image: {
    remotePatterns: [{ protocol: 'http' }, { protocol: 'https' }],
  },
});
