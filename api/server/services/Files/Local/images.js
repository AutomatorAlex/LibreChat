const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { resizeImageBuffer } = require('../images/resize');
const { updateUser } = require('~/models/userMethods');
const { updateFile } = require('~/models/File');
const { logger } = require('~/config');

/**
 * Converts an image file to the target format. The function first resizes the image based on the specified
 * resolution.
 *
 * If the original image is already in target format, it writes the resized image back. Otherwise,
 * it converts the image to target format before saving.
 *
 * The original image is deleted after conversion.
 * @param {Object} params - The params object.
 * @param {Object} params.req - The request object from Express. It should have a `user` property with an `id`
 *                       representing the user, and an `app.locals.paths` object with an `imageOutput` path.
 * @param {Express.Multer.File} params.file - The file object, which is part of the request. The file object should
 *                                     have a `path` property that points to the location of the uploaded file.
 * @param {string} params.file_id - The file ID.
 * @param {EModelEndpoint} params.endpoint - The params object.
 * @param {string} [params.resolution='high'] - Optional. The desired resolution for the image resizing. Default is 'high'.
 *
 * @returns {Promise<{ filepath: string, bytes: number, width: number, height: number}>}
 *          A promise that resolves to an object containing:
 *            - filepath: The path where the converted image is saved.
 *            - bytes: The size of the converted image in bytes.
 *            - width: The width of the converted image.
 *            - height: The height of the converted image.
 */
async function uploadLocalImage({ req, file, file_id, endpoint, resolution = 'high' }) {
  const inputFilePath = file.path;
  const inputBuffer = await fs.promises.readFile(inputFilePath);
  const {
    buffer: resizedBuffer,
    width,
    height,
  } = await resizeImageBuffer(inputBuffer, resolution, endpoint);
  const extension = path.extname(inputFilePath);

  const { imageOutput } = req.app.locals.paths;
  const userPath = path.join(imageOutput, req.user.id);

  if (!fs.existsSync(userPath)) {
    fs.mkdirSync(userPath, { recursive: true });
  }

  const fileName = `${file_id}__${path.basename(inputFilePath)}`;
  const newPath = path.join(userPath, fileName);
  const targetExtension = `.${req.app.locals.imageOutputType}`;

  if (extension.toLowerCase() === targetExtension) {
    const bytes = Buffer.byteLength(resizedBuffer);
    await fs.promises.writeFile(newPath, resizedBuffer);
    const filepath = path.posix.join('/', 'images', req.user.id, path.basename(newPath));
    return { filepath, bytes, width, height };
  }

  const outputFilePath = newPath.replace(extension, targetExtension);
  const data = await sharp(resizedBuffer).toFormat(req.app.locals.imageOutputType).toBuffer();
  await fs.promises.writeFile(outputFilePath, data);
  const bytes = Buffer.byteLength(data);
  const filepath = path.posix.join('/', 'images', req.user.id, path.basename(outputFilePath));
  await fs.promises.unlink(inputFilePath);
  return { filepath, bytes, width, height };
}

/**
 * Encodes an image file to base64.
 * @param {string} imagePath - The path to the image file.
 * @returns {Promise<string>} A promise that resolves with the base64 encoded image data.
 */
function encodeImage(imagePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString('base64'));
      }
    });
  });
}

/**
 * Local: Updates the file and encodes the image to base64,
 * for image payload handling: tuple order of [filepath, base64].
 * @param {Object} req - The request object.
 * @param {MongoFile} file - The file object.
 * @returns {Promise<[MongoFile, string]>} - A promise that resolves to an array of results from updateFile and encodeImage.
 */
async function prepareImagesLocal(req, file) {
  const { publicPath, imageOutput } = req.app.locals.paths;
  const userPath = path.join(imageOutput, req.user.id);

  if (!fs.existsSync(userPath)) {
    fs.mkdirSync(userPath, { recursive: true });
  }
  const filepath = path.join(publicPath, file.filepath);

  const promises = [];
  promises.push(updateFile({ file_id: file.file_id }));
  promises.push(encodeImage(filepath));
  return await Promise.all(promises);
}

/**
 * Cleans up old avatar files for a user, keeping only the most recent ones.
 * @param {string} userDir - The user's avatar directory path.
 * @param {number} keepCount - Number of recent avatar files to keep (default: 3).
 * @returns {Promise<void>}
 */
async function cleanupOldAvatars(userDir, keepCount = 3) {
  try {
    if (!fs.existsSync(userDir)) {
      return;
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
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

    // Keep only the most recent files, delete the rest
    if (avatarFiles.length > keepCount) {
      const filesToDelete = avatarFiles.slice(keepCount);

      for (const file of filesToDelete) {
        try {
          await fs.promises.unlink(file.path);
          logger.debug(`[cleanupOldAvatars] Deleted old avatar: ${file.name}`);
        } catch (error) {
          logger.warn(`[cleanupOldAvatars] Failed to delete ${file.name}:`, error);
        }
      }

      logger.debug(
        `[cleanupOldAvatars] Cleaned up ${filesToDelete.length} old avatar files for user`,
      );
    }
  } catch (error) {
    logger.error('[cleanupOldAvatars] Error during avatar cleanup:', error);
  }
}

/**
 * Uploads a user's avatar to local server storage and returns the URL.
 * If the 'manual' flag is set to 'true', it also updates the user's avatar URL in the database.
 * This version includes cleanup of old avatar files to prevent accumulation.
 *
 * @param {object} params - The parameters object.
 * @param {Buffer} params.buffer - The Buffer containing the avatar image.
 * @param {string} params.userId - The user ID.
 * @param {string} params.manual - A string flag indicating whether the update is manual ('true' or 'false').
 * @returns {Promise<string>} - A promise that resolves with the URL of the uploaded avatar.
 * @throws {Error} - Throws an error if there is an error in uploading or cleanup.
 */
async function processLocalAvatar({ buffer, userId, manual }) {
  const userDir = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'client',
    'public',
    'images',
    userId,
  );

  const fileName = `avatar-${new Date().getTime()}.png`;
  const urlRoute = `/images/${userId}/${fileName}`;
  const avatarPath = path.join(userDir, fileName);

  try {
    // Ensure user directory exists
    await fs.promises.mkdir(userDir, { recursive: true });

    // Write the new avatar file
    await fs.promises.writeFile(avatarPath, buffer);
    logger.debug(`[processLocalAvatar] Avatar saved: ${fileName} for user ${userId}`);

    // Clean up old avatar files (keep 3 most recent)
    await cleanupOldAvatars(userDir, 3);

    const isManual = manual === 'true';
    let url = `${urlRoute}?manual=${isManual}`;

    if (isManual) {
      await updateUser(userId, { avatar: url });
      logger.debug(`[processLocalAvatar] User avatar URL updated in database: ${url}`);
    }

    return url;
  } catch (error) {
    logger.error(`[processLocalAvatar] Error processing avatar for user ${userId}:`, error);
    throw error;
  }
}

module.exports = { uploadLocalImage, encodeImage, prepareImagesLocal, processLocalAvatar };
