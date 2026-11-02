import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mayankmanjul.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
