const fs = require('fs');
const path = require('path');
const { logger } = require('~/config');

/**
 * Cleanup utility for removing old avatar files across all users
 * This script helps clean up accumulated avatar files from before the fix was implemented
 */

/**
 * Cleans up old avatar files for a specific user directory
 * @param {string} userDir - Path to user's avatar directory
 * @param {number} keepCount - Number of recent files to keep
 * @param {boolean} dryRun - If true, only logs what would be deleted without actually deleting
 * @returns {Promise<{deleted: number, kept: number}>}
 */
async function cleanupUserAvatars(userDir, keepCount = 3, dryRun = false) {
  try {
    if (!fs.existsSync(userDir)) {
      return { deleted: 0, kept: 0 };
    }

    const files = await fs.promises.readdir(userDir);
    const avatarFiles = files
      .filter((file) => file.startsWith('avatar-') && file.endsWith('.png'))
      .map((file) => {
        const filePath = path.join(userDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime,
          size: stats.size,
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

    const toKeep = avatarFiles.slice(0, keepCount);
    const toDelete = avatarFiles.slice(keepCount);

    if (toDelete.length > 0) {
      const totalSize = toDelete.reduce((sum, file) => sum + file.size, 0);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

      if (dryRun) {
        console.log(`  Would delete ${toDelete.length} files (${sizeInMB} MB):`);
        toDelete.forEach((file) => console.log(`    - ${file.name}`));
      } else {
        console.log(`  Deleting ${toDelete.length} old avatar files (${sizeInMB} MB)...`);
        for (const file of toDelete) {
          try {
            await fs.promises.unlink(file.path);
            console.log(`    ✓ Deleted: ${file.name}`);
          } catch (error) {
            console.warn(`    ✗ Failed to delete ${file.name}:`, error.message);
          }
        }
      }
    }

    return { deleted: toDelete.length, kept: toKeep.length };
  } catch (error) {
    console.error(`Error cleaning up user directory ${userDir}:`, error.message);
    return { deleted: 0, kept: 0 };
  }
}

/**
 * Main cleanup function that processes all user directories
 * @param {Object} options - Cleanup options
 * @param {number} options.keepCount - Number of recent avatar files to keep per user
 * @param {boolean} options.dryRun - If true, only shows what would be deleted
 * @param {string} options.imagesPath - Path to the images directory
 */
async function cleanupAllAvatars(options = {}) {
  const {
    keepCount = 3,
    dryRun = false,
    imagesPath = path.resolve(__dirname, '..', 'client', 'public', 'images'),
  } = options;

  console.log('🧹 Avatar Cleanup Utility');
  console.log('========================');
  console.log(`Images directory: ${imagesPath}`);
  console.log(`Keep count: ${keepCount} files per user`);
  console.log(
    `Mode: ${dryRun ? 'DRY RUN (no files will be deleted)' : 'LIVE (files will be deleted)'}`,
  );
  console.log('');

  if (!fs.existsSync(imagesPath)) {
    console.log('❌ Images directory does not exist. Nothing to clean up.');
    return;
  }

  try {
    const userDirs = await fs.promises.readdir(imagesPath);
    let totalDeleted = 0;
    let totalKept = 0;
    let processedUsers = 0;

    for (const userDir of userDirs) {
      const userPath = path.join(imagesPath, userDir);
      const stat = await fs.promises.stat(userPath);

      if (stat.isDirectory()) {
        console.log(`📁 Processing user: ${userDir}`);
        const result = await cleanupUserAvatars(userPath, keepCount, dryRun);

        if (result.deleted > 0 || result.kept > 0) {
          totalDeleted += result.deleted;
          totalKept += result.kept;
          processedUsers++;
          console.log(
            `  Kept: ${result.kept}, ${dryRun ? 'Would delete' : 'Deleted'}: ${result.deleted}`,
          );
        } else {
          console.log('  No avatar files found');
        }
      }
    }

    console.log('');
    console.log('📊 Cleanup Summary');
    console.log('==================');
    console.log(`Users processed: ${processedUsers}`);
    console.log(`Files kept: ${totalKept}`);
    console.log(`Files ${dryRun ? 'that would be deleted' : 'deleted'}: ${totalDeleted}`);

    if (dryRun && totalDeleted > 0) {
      console.log('');
      console.log('💡 To actually delete these files, run:');
      console.log('   node config/cleanup-avatars.js --live');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  const keepCount = parseInt(args.find((arg) => arg.startsWith('--keep='))?.split('=')[1]) || 3;

  cleanupAllAvatars({ dryRun, keepCount }).catch((error) => {
    console.error('Failed to run cleanup:', error);
    process.exit(1);
  });
}

module.exports = { cleanupAllAvatars, cleanupUserAvatars };
