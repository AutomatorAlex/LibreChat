const sharp = require('sharp');
const { EModelEndpoint } = require('librechat-data-provider');

/**
 * Resizes an image from a given buffer based on the specified resolution.
 *
 * @param {Buffer} inputBuffer - The buffer of the image to be resized.
 * @param {'low' | 'high'} resolution - The resolution to resize the image to.
 *                                      'low' for a maximum of 512x512 resolution,
 *                                      'high' to keep original resolution (uncapped).
 * @param {EModelEndpoint} endpoint - Identifier for specific endpoint handling
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>} An object containing the resized image buffer and its dimensions.
 * @throws Will throw an error if the resolution parameter is invalid.
 */
async function resizeImageBuffer(inputBuffer, resolution, endpoint) {
  const maxLowRes = 512;
  // maxShortSideHighRes and maxLongSideHighRes are no longer used for 'high' resolution.

  let resizeOptions = { fit: 'inside', withoutEnlargement: true };

  if (resolution === 'low') {
    resizeOptions.width = maxLowRes;
    resizeOptions.height = maxLowRes;
  } else if (resolution === 'high') {
    const metadata = await sharp(inputBuffer).metadata();
    // For 'high' resolution, effectively don't cap the image size.
    // Use original dimensions. Rotation will still be applied by .rotate()
    // and withoutEnlargement: true prevents making it larger.
    resizeOptions.width = metadata.width;
    resizeOptions.height = metadata.height;
  } else {
    throw new Error('Invalid resolution parameter');
  }

  const resizedBuffer = await sharp(inputBuffer).rotate().resize(resizeOptions).toBuffer();

  const resizedMetadata = await sharp(resizedBuffer).metadata();
  return {
    buffer: resizedBuffer,
    bytes: resizedMetadata.size,
    width: resizedMetadata.width,
    height: resizedMetadata.height,
  };
}

/**
 * Resizes an image buffer to a specified format and width.
 *
 * @param {Object} options - The options for resizing and converting the image.
 * @param {Buffer} options.inputBuffer - The buffer of the image to be resized.
 * @param {string} options.desiredFormat - The desired output format of the image.
 * @param {number} [options.width=150] - The desired width of the image. Defaults to 150 pixels.
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, bytes: number }>} An object containing the resized image buffer, its size, and dimensions.
 * @throws Will throw an error if the resolution or format parameters are invalid.
 */
async function resizeAndConvert({ inputBuffer, desiredFormat, width = 150 }) {
  const resizedBuffer = await sharp(inputBuffer)
    .resize({ width })
    .toFormat(desiredFormat)
    .toBuffer();
  const resizedMetadata = await sharp(resizedBuffer).metadata();
  return {
    buffer: resizedBuffer,
    width: resizedMetadata.width,
    height: resizedMetadata.height,
    bytes: Buffer.byteLength(resizedBuffer),
  };
}

module.exports = { resizeImageBuffer, resizeAndConvert };
