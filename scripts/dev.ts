import { homedir } from 'node:os';
import { $ } from 'bun';
import { watch } from 'chokidar';

// Configuration
const config = {
  contentDir: Bun.env.CONTENT_DIR?.replace('~', homedir()),
  // File patterns to watch
  watchPatterns: ['**/*.md', '**/*.mdx'],
  // Patterns to ignore
  ignorePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    // Add these to prevent infinite loops
    '**/public/**',
    '**/src/content/posts/**', // Ignore the destination directory
  ],
};

if (!config.contentDir) {
  throw new Error('CONTENT_DIR environment variable is not set');
}

class DevSyncScheduler {
  private isRunning: boolean = false;

  constructor() {
    console.log('Starting development watch process...');
    console.log(`Watching ${config.contentDir}`);
    console.log('Files will sync immediately on change');
  }

  async runSync() {
    if (this.isRunning) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('\nSyncing content...');

      // Run the copy and assets scripts directly
      await $`bun run content:copy`;
      await $`bun run content:assets`;

      console.log('Content sync complete');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isRunning = false;
    }
  }

  handleFileChange(path: string) {
    // Only trigger sync for files in the content directory
    if (path.includes(config.contentDir!)) {
      console.log(`\nFile changed: ${path}`);
      this.runSync();
    }
  }
}

// Create scheduler instance
const scheduler = new DevSyncScheduler();

// Set up file watcher
const watcher = watch(config.contentDir, {
  ignored: config.ignorePatterns,
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

// Watch for changes
watcher
  .on('add', (path) => scheduler.handleFileChange(path))
  .on('change', (path) => scheduler.handleFileChange(path))
  .on('unlink', (path) => scheduler.handleFileChange(path));

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  watcher.close().then(() => process.exit(0));
});
