import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';

function updateSWCacheVersion() {
  return {
    name: 'update-sw-cache-version',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const swPath = new URL('./sw.js', dir);
        if (fs.existsSync(swPath)) {
          let swContent = fs.readFileSync(swPath, 'utf8');
          const version = Date.now().toString(36);
          swContent = swContent.replace(/const CACHE_NAME\s*=\s*['"][^'"]+['"];/, `const CACHE_NAME = 'panda-droom-v-${version}';`);
          fs.writeFileSync(swPath, swContent);
          console.log(`\n✅ Updated sw.js cache version to: v-${version}\n`);
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://martijndevalk.github.io',
  base: '/panda-droom',
  integrations: [react(), tailwind(), updateSWCacheVersion()]
});
