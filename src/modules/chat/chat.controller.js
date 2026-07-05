const {
  createPrivateChat,
  createGroupChat,
  getUserChats,
  getSingleChat,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  updateMemberRole,
  deleteConversation,
  muteConversation,
  archiveConversation,
  searchChats,unarchiveConversation,
} = require('./chat.service')

async function createPrivateChatController(req, res) {
  try {
    const chat = await createPrivateChat(
      req.user.id,
      req.body.recieverId
    )
    return res.status(201).json({
      message: 'Chat created successfully',
      chat
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function createGroupChatController(req, res) {
  try {
    const group = await createGroupChat(
      req.user.id,
      req.body.name,
      req.body.members
    )
    return res.status(201).json({
      message: 'Group created successfully',
      group
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function getUserChatsController(req, res) {
  try {
    const chats = await getUserChats(
      req.user.id,
      req.query.archived === 'true'
    )
    return res.status(200).json({ chats })
  } catch (error) {
    return res.status(400).json({
      message: 'Unable to load conversations'
    })
  }
}

async function getSingleChatController(req, res) {
  try {
    const chat = await getSingleChat(
      req.user.id,
      req.params.conversationId
    )
    return res.status(200).json({ chat })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function updateGroupController(req, res) {
  try {
    const group = await updateGroup(
      req.user.id,
      req.params.conversationId,
      req.body.name,
      req.body.image
    )
    return res.status(200).json({
      message: 'Group updated successfully',
      group
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function addMembersController(req, res) {
  try {
    const result = await addMembers(
      req.user.id,
      req.params.conversationId,
      req.body.members
    )
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function removeMemberController(req, res) {
  try {
    const result = await removeMember(
      req.user.id,
      req.params.conversationId,
      req.body.memberId
    )
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function leaveGroupController(req, res) {
  try {
    const result = await leaveGroup(
      req.user.id,
      req.params.conversationId
    )
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function promoteMemberController(req, res) {
  try {
    const member = await updateMemberRole(
      req.user.id,
      req.params.conversationId,
      req.body.memberId,
      'Admin'
    )
    return res.status(200).json({
      message: 'Member promoted successfully',
      member
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function demoteMemberController(req, res) {
  try {
    const member = await updateMemberRole(
      req.user.id,
      req.params.conversationId,
      req.body.memberId,
      'Member'
    )
    return res.status(200).json({
      message: 'Admin demoted successfully',
      member
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function deleteConversationController(req, res) {
  try {
    const result = await deleteConversation(
      req.user.id,
      req.params.conversationId
    )
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function muteConversationController(req, res) {
  try {
    const membership = await muteConversation(
      req.user.id,
      req.params.conversationId,
      req.body.mutedUntil
    )
    return res.status(200).json({ membership })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function archiveConversationController(req, res) {
  try {
    const membership = await archiveConversation(
      req.user.id,
      req.params.conversationId,
      req.body.archived !== false
    )
    return res.status(200).json({ membership })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function unarchiveConversationController(req, res) {
  try {
    const result = await unarchiveConversation(
      req.user.id,
      req.params.conversationId
    )

    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}
async function searchChatsController(req, res) {
  try {
    const chats = await searchChats(
      req.user.id,
      req.query.q
    )
    return res.status(200).json({ chats })
  } catch (error) {
    return res.status(400).json({
      message: 'Unable to search conversations'
    })
  }
}

module.exports = {
  createPrivateChatController,
  createGroupChatController,
  getUserChatsController,
  getSingleChatController,
  updateGroupController,
  addMembersController,
  removeMemberController,
  leaveGroupController,
  promoteMemberController,
  demoteMemberController,
  deleteConversationController,
  muteConversationController,
  archiveConversationController,
  searchChatsController,unarchiveConversationController
}
