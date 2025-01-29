import { existsSync, mkdirSync } from 'node:fs';
import { copyFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

// Regular expression to match markdown image syntax
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(path);
      }
      return path;
    }),
  );
  return files.flat();
}

async function ensureDirectoryExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function copyImageToPublic(sourcePath: string, targetDir: string, originalPath: string): Promise<string> {
  // Get the directory structure from the original markdown image path
  // Remove any leading '/' and 'assets/' from the path
  const normalizedPath = originalPath.startsWith('/') ? originalPath.slice(1) : originalPath;
  const pathWithoutAssets = normalizedPath.startsWith('assets/') ? normalizedPath.slice(7) : normalizedPath;

  // Create the full target path maintaining directory structure
  const targetPath = join(targetDir, pathWithoutAssets);

  // Create target directory if it doesn't exist
  await ensureDirectoryExists(dirname(targetPath));

  // Copy the file
  await copyFile(sourcePath, targetPath);

  return targetPath;
}

async function processMarkdownFile(file: string) {
  const content = await Bun.file(file).text();
  const matches = Array.from(content.matchAll(IMAGE_REGEX));

  if (matches.length === 0) return;

  console.log(`Processing images in ${file}`);

  for (const match of matches) {
    const [_, alt, imagePath] = match;

    // Skip external URLs
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      continue;
    }

    // Get the content root
    const contentRoot = Bun.env.CONTENT_DIR?.replace('~', homedir());
    if (!contentRoot) {
      throw new Error('CONTENT_DIR environment variable is not set');
    }

    // Look for the image in the content root
    // Remove any leading '/' from the imagePath and don't add 'assets' since it's already in the path
    const normalizedImagePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullImagePath = join(contentRoot, normalizedImagePath);

    // Check if image exists in content assets
    if (existsSync(fullImagePath)) {
      // Copy to public/assets, maintaining directory structure
      const targetDir = 'public/assets';
      const newPath = await copyImageToPublic(fullImagePath, targetDir, imagePath);
      console.log(`Copied ${imagePath} -> ${newPath}`);
    } else {
      console.warn(`Warning: Image not found at ${fullImagePath}`);
    }
  }
}

async function main() {
  const notesDir = Bun.env.CONTENT_DIR?.replace('~', homedir());
  if (!notesDir) {
    throw new Error('CONTENT_DIR environment variable is not set');
  }

  // Ensure public image directory exists
  await ensureDirectoryExists('public/assets');

  // Get all markdown files
  const files = await getAllFiles(notesDir);
  const mdFiles = files.filter((file: string) => file.endsWith('.md') || file.endsWith('.mdx'));

  // Process each markdown file
  for (const file of mdFiles) {
    await processMarkdownFile(file);
  }
}

main().catch((error) => {
  console.error('Asset processing failed:', error);
  process.exit(1);
});
