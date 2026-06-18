const { uploadToCloudinary } = require('../../services/cloudinary');

// Controller for uploading material images
exports.uploadMaterialImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }
    // Upload each file buffer to Cloudinary and collect URLs
    const urls = await Promise.all(
      req.files.map(async file => {
        try {
          return await uploadToCloudinary(file.buffer);
        } catch (err) {
          console.error('Material image upload error:', err);
          throw err;
        }
      })
    );
    res.status(200).json({ success: true, urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
