import matter from 'gray-matter';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { type Post, PostSchema } from '@/utils/types';

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(path);
      }
      return path;
    }),
  );
  return files.flat();
}

function getUniqueSlug(baseSlug: string, extension: string): string {
  let slug = baseSlug;
  let counter = 1;

  while (existsSync(`${Bun.env.POSTS_DIR}/${slug}${extension}`)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  const notesDir = Bun.env.CONTENT_DIR?.replace('~', homedir());
  if (!notesDir) {
    throw new Error('CONTENT_DIR environment variable is not set');
  }

  await Bun.write(Bun.file(`${Bun.env.POSTS_DIR}/.gitkeep`), '');
  const files = await getAllFiles(notesDir);
  const mdFiles = files.filter(
    (file: string) => file.endsWith('.md') || file.endsWith('.mdx'),
  );

  for (const file of mdFiles) {
    const content = await Bun.file(file).text();

    try {
      const { data, content: markdownContent } = matter(content);
      const result = PostSchema.safeParse(data);

      if (!result.success) continue;

      const fileExtension = file.slice(file.lastIndexOf('.'));

      // Check if a file with this slug already exists
      const existingPath = `${Bun.env.POSTS_DIR}/${result.data.slug}${fileExtension}`;
      const slug = existsSync(existingPath)
        ? result.data.slug // Keep the existing slug if file exists
        : getUniqueSlug(result.data.slug, fileExtension); // Generate new unique slug only for new files

      const targetPath = `${Bun.env.POSTS_DIR}/${slug}${fileExtension}`;
      const isNewFile = !existsSync(targetPath);

      // Compare content and get existing frontmatter if file exists
      let contentChanged = true;
      let existingFrontmatter = {} as Post;
      if (!isNewFile) {
        const existingContent = await Bun.file(targetPath).text();
        const { content: existingMarkdownContent, data: existingData } =
          matter(existingContent);
        contentChanged =
          existingMarkdownContent.trim() !== markdownContent.trim();
        existingFrontmatter = existingData as Post;
      }

      // Rest of the frontmatter updates
      const updatedFrontmatter: Post = {
        ...existingFrontmatter, // Start with existing frontmatter
        ...result.data,
        slug,
        updatedAt: contentChanged
          ? new Date().toISOString()
          : existingFrontmatter.updatedAt || new Date().toISOString(),
        createdAt:
          isNewFile || !existingFrontmatter.createdAt
            ? new Date().toISOString()
            : existingFrontmatter.createdAt,
      };

      // Validate that no values are undefined before stringifying
      const cleanFrontmatter = Object.fromEntries(
        Object.entries(updatedFrontmatter).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      const updatedContent = matter.stringify(
        markdownContent,
        cleanFrontmatter,
      );

      await Bun.write(targetPath, updatedContent);
      console.log(`Processed ${file.replace(homedir(), '~')} -> ${targetPath}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
}

main().catch(error => {
  console.error('Content collect failed:', error);
  process.exit(1);
});
