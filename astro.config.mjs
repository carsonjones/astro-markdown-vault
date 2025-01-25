// @ts-check
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  trailingSlash: 'never',

  env: {
    schema: {
      POSTS_DIR: envField.string({
        context: 'server',
        access: 'public',
      }),
    },
  },
});
