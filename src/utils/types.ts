import { z } from 'zod';

export const PostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  published: z.boolean(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type Post = z.infer<typeof PostSchema>;
