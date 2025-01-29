import { $ } from 'bun';

async function hasGitChanges(): Promise<boolean> {
  // Check for any changes in the git working directory
  const status = await $`git status --porcelain`.text();
  return status.length > 0;
}

async function commitAndPush() {
  const timestamp = new Date()
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+ [AP]M)/, '$3-$1-$2 @ $4');

  try {
    // Stage all changes
    await $`git add .`;

    // Create commit
    await $`git commit -m ${`Content sync: ${timestamp}`}`;

    // Push changes
    await $`git push`;

    console.log('Successfully committed and pushed changes');
  } catch (error) {
    console.error('Error during git operations:', error);
    throw error;
  }
}

async function main() {
  try {
    // Run content sync
    console.log('Running content copy process...');
    await $`bun run content:copy`;

    // Run asset sync
    console.log('Running asset copy process...');
    await $`bun run content:assets`;

    // Check for changes
    const hasChanges = await hasGitChanges();

    if (hasChanges) {
      console.log('Changes detected, committing and pushing...');
      await commitAndPush();
    } else {
      console.log('No changes detected');
    }
  } catch (error) {
    console.error('Sync process failed:', error);
    process.exit(1);
  }
}

// Run the sync process
main().catch((error) => {
  console.error('Sync process failed:', error);
  process.exit(1);
});
