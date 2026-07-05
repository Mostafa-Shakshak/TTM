const onlineUsers = new Map()

function presenceSocket(io, socket) {

  const userId = socket.user.id
  const sockets = onlineUsers.get(userId) || new Set()
  const wasOffline = sockets.size === 0

  sockets.add(socket.id)
  onlineUsers.set(userId, sockets)

  if (wasOffline) {
    socket.broadcast.emit('userOnline', { userId })
  }

  socket.emit('presence:list', {
    userIds: [...onlineUsers.keys()]
  })

  socket.on('disconnect', () => {
    const currentSockets = onlineUsers.get(userId)
    if (!currentSockets) return

    currentSockets.delete(socket.id)

    if (!currentSockets.size) {
      onlineUsers.delete(userId)
      socket.broadcast.emit('userOffline', {
        userId,
        lastSeen: new Date()
      })
    }
  })
}

module.exports = presenceSocket
