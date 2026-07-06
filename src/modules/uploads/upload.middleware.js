const multer = require('multer')

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      return callback(
        new Error('Only image files are allowed')
      )
    }
    callback(null, true)
  }
}).single('image')

function uploadMiddleware(req, res, next) {
  uploadImage(req, res, err => {
    if (err) {
      return res.status(400).json({
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Image must be 5MB or smaller'
            : err.message
      })
    }
    next()
  })
}

module.exports = uploadMiddleware
