const {
  sendMessages,
  editMessage,
  deleteMessage,
  deliveredMessage,
  seenMessage
} = require('../modules/messages/messages.service')

const {
  validateConversationMember
} = require('../modules/chat/chat.service')

const {
  getConversationRoom,
  getUserRoom
} = require('./rooms')

function chatSocket(io, socket) {

  socket.on('joinConversation', async conversationId => {
    try {
      await validateConversationMember(
        socket.user.id,
        conversationId
      )
      socket.join(getConversationRoom(conversationId))
      socket.emit('joinedConversation', {
        conversationId
      })
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('leaveConversation', conversationId => {
    socket.leave(getConversationRoom(conversationId))
  })

  socket.on('sendMessage', async data => {
    try {
      const message = await sendMessages(
        socket.user.id,
        data.content,
        data.conversationId,
        data.receiverId,
        data.replyToId,
        data.image
      )

      io.to(
        getConversationRoom(message.convId)
      ).emit('newMessage', message)

      message.reciept.forEach(receipt => {
        io.to(getUserRoom(receipt.userId)).emit(
          'conversation:updated',
          { conversationId: message.convId, message }
        )
      })
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('editMessage', async data => {
    try {
      const message = await editMessage(
        socket.user.id,
        data.messageId,
        data.content
      )
      io.to(
        getConversationRoom(message.convId)
      ).emit('messageEdited', message)
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('deleteMessage', async messageId => {
    try {
      const message = await deleteMessage(
        socket.user.id,
        messageId
      )
      io.to(
        getConversationRoom(message.convId)
      ).emit('messageDeleted', {
        messageId: message.id,
        conversationId: message.convId
      })
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('typing', async ({ conversationId }) => {
    try {
      await validateConversationMember(
        socket.user.id,
        conversationId
      )
      socket.to(
        getConversationRoom(conversationId)
      ).emit('typing', {
        userId: socket.user.id,
        conversationId
      })
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('stopTyping', async ({ conversationId }) => {
    try {
      await validateConversationMember(
        socket.user.id,
        conversationId
      )
      socket.to(
        getConversationRoom(conversationId)
      ).emit('stopTyping', {
        userId: socket.user.id,
        conversationId
      })
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('messageDelivered', async ({ messageId }) => {
    try {
      const receipt = await deliveredMessage(
        socket.user.id,
        messageId
      )
      io.to(
        getConversationRoom(receipt.message.convId)
      ).emit('messageDelivered', receipt)
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })

  socket.on('messageSeen', async ({ messageId }) => {
    try {
      const receipt = await seenMessage(
        socket.user.id,
        messageId
      )
      io.to(
        getConversationRoom(receipt.message.convId)
      ).emit('messageSeen', receipt)
    } catch (error) {
      socket.emit('error', {
        message: error.message
      })
    }
  })
}

module.exports = chatSocket
