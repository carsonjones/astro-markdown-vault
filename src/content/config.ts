import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { PostSchema } from '@/utils/types';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: import.meta.env.POSTS_DIR,
  }),
  schema: PostSchema,
});

export const collections = {
  posts,
};
