const prisma = require('../../config/prisma')
const {
  deleteUploadedFileService
} = require('../uploads/upload.service')

function privacyWhere(currentUserId) {
  return {
    AND: [
      {
        OR: [
          {
            author: {
              isPrivate: false
            }
          },
          {
            authorId: currentUserId
          },
          {
            author: {
              followers: {
                some: {
                  followerId: currentUserId,
                  status: 'Accepted'
                }
              }
            }
          }
        ]
      },
      {
        author: {
          blockedUsers: {
            none: {
              blockedId: currentUserId
            }
          }
        }
      },
      {
        author: {
          blockedBy: {
            none: {
              blockerId: currentUserId
            }
          }
        }
      }
    ]
  }
}

async function getAccessiblePostService(
  postId,
  currentUserId
) {

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      ...privacyWhere(currentUserId)
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          isPrivate: true
        }
      }
    }
  })

  if (!post) {
    throw new Error('Post Not Found')
  }

  return post
}

async function createPostService(data, userId) {

  const { image, content } = data

  if (!image && !content?.trim()) {
    throw new Error("You can't share empty Post")
  }

  return prisma.post.create({
    data: {
      image,
      content: content?.trim(),
      authorId: userId
    }
  })
}

async function updatePostService(
  postId,
  userId,
  data
) {

  const post = await prisma.post.findUnique({
    where: { id: postId }
  })

  if (!post) {
    throw new Error('Post Not Found')
  }

  if (post.authorId !== userId) {
    throw new Error('Unauthorized Action')
  }

  const nextContent =
    data.content === undefined
      ? post.content
      : data.content?.trim() || null

  const nextImage =
    data.image === undefined
      ? post.image
      : data.image || null

  if (!nextContent && !nextImage) {
    throw new Error(
      "You can't update post to be empty"
    )
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      content: nextContent,
      image: nextImage
    }
  })

  if (post.image && post.image !== nextImage) {
    await deleteUploadedFileService(post.image)
  }

  return updatedPost
}

async function deletePostService(postId, userId) {

  const post = await prisma.post.findUnique({
    where: { id: postId }
  })

  if (!post) {
    throw new Error('Post Not Found')
  }

  if (post.authorId !== userId) {
    throw new Error('Unauthorized Action')
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({
      where: { postId }
    }),
    prisma.like.deleteMany({
      where: { likedPostedId: postId }
    }),
    prisma.comment.deleteMany({
      where: { postedId: postId }
    }),
    prisma.post.delete({
      where: { id: postId }
    })
  ])

  await deleteUploadedFileService(post.image)

  return {
    message: 'Post deleted successfully'
  }
}

async function getAllPostsService(currentUserId) {

  const posts = await prisma.post.findMany({
    where: privacyWhere(currentUserId),
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true
        }
      },
      likes: {
        where: {
          likedById: currentUserId
        },
        select: {
          id: true
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return formatPosts(posts)
}

async function searchPostsService(
  query,
  currentUserId
) {

  if (!query || !query.trim()) {
    return []
  }

  const posts = await prisma.post.findMany({
    where: {
      ...privacyWhere(currentUserId),
      content: {
        contains: query.trim(),
        mode: 'insensitive'
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true
        }
      },
      likes: {
        where: {
          likedById: currentUserId
        },
        select: { id: true }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 30
  })

  return formatPosts(posts)
}

async function getSinglePostService(
  postId,
  currentUserId
) {

  await getAccessiblePostService(
    postId,
    currentUserId
  )

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true
        }
      },
      comments: {
        where: {
          author: {
            blockedUsers: {
              none: {
                blockedId: currentUserId
              }
            },
            blockedBy: {
              none: {
                blockerId: currentUserId
              }
            }
          }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      likes: {
        where: {
          likedById: currentUserId
        },
        select: { id: true }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }
  })

  return {
    ...post,
    likedByMe: post.likes.length > 0,
    likeId: post.likes[0]?.id || null
  }
}

function formatPosts(posts) {
  return posts.map(post => ({
    ...post,
    likedByMe: post.likes.length > 0,
    likeId: post.likes[0]?.id || null
  }))
}

module.exports = {
  createPostService,
  updatePostService,
  deletePostService,
  getAllPostsService,
  getSinglePostService,
  searchPostsService,
  getAccessiblePostService
}
