const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const uploadRoot = path.resolve(
  __dirname,
  '../../../uploads'
)

const folders = {
  profile: 'profiles',
  cover: 'covers',
  post: 'posts',
  group: 'groups',
  chat: 'chat'
}

function getImageExtension(buffer) {

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg'
  }

  if (
    buffer[0] === 0x89 &&
    buffer.slice(1, 4).toString() === 'PNG'
  ) {
    return 'png'
  }

  if (
    buffer.slice(0, 3).toString() === 'GIF'
  ) {
    return 'gif'
  }

  if (
    buffer.slice(0, 4).toString() === 'RIFF' &&
    buffer.slice(8, 12).toString() === 'WEBP'
  ) {
    return 'webp'
  }

  throw new Error('Invalid image file')
}

async function saveImageService(file, type) {

  if (!file) {
    throw new Error('Image is required')
  }

  const folder = folders[type]

  if (!folder) {
    throw new Error('Invalid upload type')
  }

  const extension = getImageExtension(file.buffer)
  const filename =
    `${crypto.randomUUID()}.${extension}`
  const directory = path.join(uploadRoot, folder)

  await fs.mkdir(directory, {
    recursive: true
  })

  await fs.writeFile(
    path.join(directory, filename),
    file.buffer
  )

  const relativeUrl =
    `/uploads/${folder}/${filename}`

  return {
    imageUrl:
      `${process.env.APP_URL || 'http://localhost:5555'}${relativeUrl}`,
    relativeUrl
  }
}

async function deleteUploadedFileService(imageUrl) {

  if (!imageUrl || !imageUrl.includes('/uploads/')) {
    return
  }

  try {
    const parsed = new URL(
      imageUrl,
      process.env.APP_URL || 'http://localhost:5555'
    )

    const relativePath = parsed.pathname.replace(
      /^\/uploads\//,
      ''
    )

    const filePath = path.resolve(
      uploadRoot,
      relativePath
    )

    if (!filePath.startsWith(uploadRoot)) {
      return
    }

    await fs.unlink(filePath)

  } catch (err) {

    if (err.code !== 'ENOENT') {
      console.error('Unable to delete image', err.message)
    }

  }
}

module.exports = {
  saveImageService,
  deleteUploadedFileService
}
