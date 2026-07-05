const {
  getUserRoom
} = require('./rooms')

function usersSocket(io, socket) {
  socket.join(getUserRoom(socket.user.id))
}

module.exports = usersSocket
