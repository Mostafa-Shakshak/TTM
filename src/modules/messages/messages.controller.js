const {
  sendMessages,
  getMessages,
  searchMessages,
  editMessage,
  deleteMessage
} = require('./messages.service')

async function sendMessagesController(req, res) {
  try {
    const message = await sendMessages(
      req.user.id,
      req.body.content,
      req.params.conversationId,
      req.body.receiverId,
      req.body.replyToId,
      req.body.image
    )
    return res.status(201).json({
      message: 'Message sent successfully',
      data: message
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function getMessagesController(req, res) {
  try {
    const messages = await getMessages(
      req.user.id,
      req.params.conversationId
    )
    return res.status(200).json({ messages })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function searchMessagesController(req, res) {
  try {
    const messages = await searchMessages(
      req.user.id,
      req.query.q
    )
    return res.status(200).json({ messages })
  } catch (error) {
    return res.status(400).json({
      message: 'Unable to search messages'
    })
  }
}

async function editMessageController(req, res) {
  try {
    const message = await editMessage(
      req.user.id,
      req.params.messageId,
      req.body.content
    )
    return res.status(200).json({
      message: 'Message updated successfully',
      data: message
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

async function deleteMessageController(req, res) {
  try {
    const message = await deleteMessage(
      req.user.id,
      req.params.messageId
    )
    return res.status(200).json({
      message: 'Message deleted successfully',
      data: message
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

module.exports = {
  sendMessagesController,
  getMessagesController,
  searchMessagesController,
  editMessageController,
  deleteMessageController
}
