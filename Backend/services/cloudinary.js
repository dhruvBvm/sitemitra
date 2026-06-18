

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Simplified Cloudinary configuration detection
// Simplified Cloudinary configuration detection

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
  process.env.CLOUDINARY_API_KEY.trim() !== '' &&
  process.env.CLOUDINARY_API_SECRET.trim() !== '';

if (hasCloudinaryConfig) {
  // Configure Cloudinary using environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  console.warn('⚠️ Cloudinary credentials are missing or empty. Image uploads will be skipped and a placeholder URL will be used.');
}

/**
 * Uploads a buffer to Cloudinary and returns the secure URL.
 * If Cloudinary is not configured, returns a placeholder image URL.
 * @param {Buffer} buffer - Image buffer to upload.
 * @returns {Promise<string>} Secure URL of the uploaded image (or placeholder).
 */
function uploadToCloudinary(buffer) {
  if (!hasCloudinaryConfig) {
    console.error('⚠️ Cloudinary configuration missing when attempting upload');
    return Promise.reject(new Error('Cloudinary is not configured.'));
  }
  if (!buffer || !Buffer.isBuffer(buffer)) {
    console.error('Invalid buffer provided to uploadToCloudinary');
    return Promise.reject(new Error('Invalid buffer'));
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        // Log detailed error info if available
        if (error.response && error.response.body) {
          console.error('Cloudinary response body:', error.response.body);
        }
        return reject(error);
      }
      resolve(result.secure_url);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = { uploadToCloudinary };
