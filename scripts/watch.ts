import { watch } from 'chokidar';
import { homedir } from 'node:os';
import { $ } from 'bun';

if (!Bun.env.WATCH_INTERVAL_MINUTES) {
  throw new Error('WATCH_INTERVAL_MINUTES environment variable is not set');
}

// Configuration
const config = {
  debounceTime: parseInt(Bun.env.WATCH_INTERVAL_MINUTES) * 60 * 1000,
  contentDir: Bun.env.CONTENT_DIR?.replace('~', homedir()),
  // File patterns to watch
  watchPatterns: ['**/*.md', '**/*.mdx'],
  // Patterns to ignore
  ignorePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
};

if (!config.contentDir) {
  throw new Error('CONTENT_DIR environment variable is not set');
}

class SyncScheduler {
  private timer: NodeJS.Timer | null = null;
  private lastSync: Date | null = null;
  private isRunning: boolean = false;

  constructor() {
    // Log startup
    console.log('Starting watch process...');
    console.log(`Watching ${config.contentDir}`);
    console.log(
      `Will sync after ${config.debounceTime / 1000} seconds of no changes`,
    );
  }

  async runSync() {
    if (this.isRunning) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('Running sync process...');

      // Run the sync script
      await $`bun run content:sync`;

      this.lastSync = new Date();
      console.log(`Watch completed at ${this.lastSync.toLocaleString()}`);

      // Schedule next sync after completion
      this.scheduleSync();
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isRunning = false;
    }
  }

  scheduleSync() {
    // Clear existing timer if any
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Schedule new sync
    this.timer = setTimeout(() => {
      this.runSync();
    }, config.debounceTime);

    console.log(
      `Sync scheduled for ${new Date(Date.now() + config.debounceTime).toLocaleString()}`,
    );
  }

  handleFileChange(path: string) {
    console.log(`File changed: ${path}`);
    this.scheduleSync();
  }
}

// Create scheduler instance
const scheduler = new SyncScheduler();

// Set up file watcher
const watcher = watch(config.contentDir, {
  ignored: config.ignorePatterns,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000, // Wait 2 seconds after last write
    pollInterval: 100,
  },
});

// Watch for changes
watcher
  .on('add', path => scheduler.handleFileChange(path))
  .on('change', path => scheduler.handleFileChange(path))
  .on('unlink', path => scheduler.handleFileChange(path));

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  watcher.close().then(() => process.exit(0));
});

// Initial sync on startup
scheduler.scheduleSync();
