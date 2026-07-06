const {
  saveImageService,
  deleteUploadedFileService
} = require('./upload.service')

const prisma = require('../../config/prisma')

async function uploadImage(req, res) {
  try {
    const { type } = req.params

    const result = await saveImageService(
      req.file,
      type
    )

    if (type === 'profile' || type === 'cover') {

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          profileImage: true,
          coverImage: true
        }
      })

      const previousImage =
        type === 'profile'
          ? user.profileImage
          : user.coverImage

      await prisma.user.update({
        where: { id: req.user.id },
        data: type === 'profile'
          ? { profileImage: result.imageUrl }
          : { coverImage: result.imageUrl }
      })

      await deleteUploadedFileService(previousImage)
    }

    return res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: result.imageUrl
    })

  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Unable to upload image'
    })
  }
}

module.exports = {
  uploadImage
}
