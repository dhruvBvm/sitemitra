const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Duplicate value entered for ${field}` });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
