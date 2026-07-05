const prisma = require('../../config/prisma')
const {
  deleteUploadedFileService
} = require('../uploads/upload.service')
const {
  createNotificationService
} = require('../Notifications/notification.service')

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

function postInclude(currentUserId) {
  return {
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
  }
}

function singlePostInclude(currentUserId) {
  return {
    ...postInclude(currentUserId),
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
    }
  }
}

function formatSinglePost(post) {
  const likes = post.likes || []
  return {
    ...post,
    likes: undefined,
    likedByMe: likes.length > 0,
    likeId: likes[0]?.id || null
  }
}

async function attachSharedPosts(posts, currentUserId) {
  const sharedIds = [...new Set(posts.map((post) => post.sharedPostId).filter(Boolean))]

  if (!sharedIds.length) {
    return posts.map((post) => formatSinglePost({ ...post, sharedPost: null }))
  }

  const sharedPosts = await prisma.post.findMany({
    where: {
      id: { in: sharedIds },
      ...privacyWhere(currentUserId)
    },
    include: postInclude(currentUserId)
  })

  const sharedMap = new Map(
    sharedPosts.map((post) => [post.id, formatSinglePost({ ...post, sharedPost: null })])
  )

  return posts.map((post) => formatSinglePost({
    ...post,
    sharedPost: post.sharedPostId ? sharedMap.get(post.sharedPostId) || null : null
  }))
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

  const post = await prisma.post.create({
    data: {
      image,
      content: content?.trim() || null,
      authorId: userId
    },
    include: postInclude(userId)
  })

  return formatSinglePost({ ...post, sharedPost: null })
}

async function sharePostService(postId, userId, content) {
  const targetPost = await getAccessiblePostService(
    postId,
    userId
  )

  const sharedPostId = targetPost.sharedPostId || targetPost.id

  const shared = await prisma.post.create({
    data: {
      authorId: userId,
      content: content?.trim() || null,
      sharedPostId
    },
    include: postInclude(userId)
  })

  const notification = await createNotificationService({
    type: 'Share',
    recipientId: targetPost.authorId,
    actorId: userId,
    postId: targetPost.id
  })

  const [formatted] = await attachSharedPosts([shared], userId)
  return {
    post: formatted,
    notification
  }
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

  if (!nextContent && !nextImage && !post.sharedPostId) {
    throw new Error(
      "You can't update post to be empty"
    )
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      content: nextContent,
      image: nextImage
    },
    include: postInclude(userId)
  })

  if (post.image && post.image !== nextImage) {
    await deleteUploadedFileService(post.image)
  }

  const [formatted] = await attachSharedPosts([updatedPost], userId)
  return formatted
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
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: 'desc'
    }
  })

  return attachSharedPosts(posts, currentUserId)
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
      OR: [
        {
          content: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        },
        {
          sharedPost: {
            is: {
              content: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    },
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: 'desc'
    },
    take: 30
  })

  return attachSharedPosts(posts, currentUserId)
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
    include: singlePostInclude(currentUserId)
  })

  const [formatted] = await attachSharedPosts([post], currentUserId)
  return formatted
}

async function getPostsByAuthorService(
  authorId,
  currentUserId
) {
  const posts = await prisma.post.findMany({
    where: {
      authorId
    },
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: 'desc'
    }
  })

  return attachSharedPosts(posts, currentUserId)
}

module.exports = {
  createPostService,
  sharePostService,
  updatePostService,
  deletePostService,
  getAllPostsService,
  getSinglePostService,
  searchPostsService,
  getAccessiblePostService,
  getPostsByAuthorService
}
