import { rm } from 'fs/promises';
import { join } from 'path';
import { readdir } from 'fs/promises';

if (!Bun.env.POSTS_DIR) {
  throw new Error('POSTS_DIR environment variable is not set');
}

async function clean() {
  try {
    const files = await readdir(Bun.env.POSTS_DIR!);

    for (const file of files) {
      if (file === '.gitkeep') continue;

      const filePath = join(Bun.env.POSTS_DIR!, file);
      await rm(filePath, { recursive: true, force: true });
    }

    console.log('Successfully cleaned posts directory');
  } catch (error) {
    console.error('Error cleaning posts directory:', error);
    process.exit(1);
  }
}

clean();
