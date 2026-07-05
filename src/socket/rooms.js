function getUserRoom(userId) {
  return `user:${userId}`
}

function getConversationRoom(conversationId) {
  return `conversation:${conversationId}`
}

module.exports = {
  getUserRoom,
  getConversationRoom
}
