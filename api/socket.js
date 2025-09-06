import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    res.socket.server.io = io

    // Store room information
    const rooms = new Map()

    // Room utility functions
    function generateRoomId() {
      return Math.random().toString(36).substr(2, 8).toUpperCase()
    }

    function createRoom(roomId) {
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          currentVideo: null,
          createdAt: Date.now(),
          lastActivity: Date.now()
        })
        console.log(`Room created: ${roomId}`)
      }
      return rooms.get(roomId)
    }

    function addUserToRoom(roomId, userId, userData) {
      const room = rooms.get(roomId)
      if (room) {
        room.users.set(userId, userData)
        room.lastActivity = Date.now()
        return true
      }
      return false
    }

    function removeUserFromRoom(roomId, userId) {
      const room = rooms.get(roomId)
      if (room) {
        room.users.delete(userId)
        room.lastActivity = Date.now()
        return true
      }
      return false
    }

    function updateRoomVideo(roomId, videoData) {
      const room = rooms.get(roomId)
      if (room) {
        room.currentVideo = videoData
        room.lastActivity = Date.now()
        return true
      }
      return false
    }

    io.on('connection', socket => {
      console.log(`✅ User connected: ${socket.id}`)
      
      let currentRoom = null
      let username = 'Guest'

      socket.on('create-room', (data) => {
        try {
          username = data.username || 'Guest'
          const roomId = generateRoomId()
          const room = createRoom(roomId)
          
          const userData = {
            id: socket.id,
            username: username,
            joinedAt: Date.now()
          }
          
          addUserToRoom(roomId, socket.id, userData)
          socket.join(roomId)
          currentRoom = roomId
          
          socket.emit('room-joined', {
            roomId: roomId,
            userCount: room.users.size,
            currentVideo: room.currentVideo
          })
          
          console.log(`${username} created and joined room: ${roomId}`)
        } catch (error) {
          console.error('Error creating room:', error)
          socket.emit('error', { message: 'Failed to create room' })
        }
      })

      socket.on('join-room', (data) => {
        try {
          const { roomId, username: newUsername } = data
          username = newUsername || 'Guest'
          
          let room = rooms.get(roomId)
          if (!room) {
            room = createRoom(roomId)
          }
          
          const userData = {
            id: socket.id,
            username: username,
            joinedAt: Date.now()
          }
          
          addUserToRoom(roomId, socket.id, userData)
          socket.join(roomId)
          currentRoom = roomId
          
          socket.emit('room-joined', {
            roomId: roomId,
            userCount: room.users.size,
            currentVideo: room.currentVideo
          })
          
          socket.to(roomId).emit('user-joined', {
            username: username,
            userCount: room.users.size
          })
          
          console.log(`${username} joined room: ${roomId}`)
        } catch (error) {
          console.error('Error joining room:', error)
          socket.emit('error', { message: 'Failed to join room' })
        }
      })

      socket.on('video-action', (data) => {
        try {
          const { roomId, action, time, userId } = data
          
          if (currentRoom && currentRoom === roomId) {
            socket.to(roomId).emit('video-action', {
              action: action,
              time: time,
              userId: userId,
              timestamp: Date.now()
            })
            console.log(`Video action in ${roomId}: ${action} at ${time}s by ${username}`)
          }
        } catch (error) {
          console.error('Error handling video action:', error)
        }
      })

      socket.on('video-load', (data) => {
        try {
          const { roomId, videoId, videoUrl, userId } = data
          
          if (currentRoom && currentRoom === roomId) {
            const videoData = {
              videoId: videoId,
              videoUrl: videoUrl,
              loadedBy: username,
              loadedAt: Date.now()
            }
            
            updateRoomVideo(roomId, videoData)
            
            socket.to(roomId).emit('video-load', {
              videoId: videoId,
              videoUrl: videoUrl,
              userId: userId,
              loadedBy: username
            })
            
            console.log(`Video loaded in ${roomId}: ${videoId} by ${username}`)
          }
        } catch (error) {
          console.error('Error handling video load:', error)
        }
      })

      socket.on('chat-message', (data) => {
        try {
          const { roomId, message, username: chatUsername, userId } = data
          
          if (currentRoom && currentRoom === roomId) {
            const chatData = {
              message: message,
              username: chatUsername,
              userId: userId,
              timestamp: Date.now()
            }
            
            io.to(roomId).emit('chat-message', chatData)
            console.log(`Chat message in ${roomId} by ${chatUsername}: ${message}`)
          }
        } catch (error) {
          console.error('Error handling chat message:', error)
        }
      })

      socket.on('disconnect', () => {
        try {
          console.log(`User disconnected: ${socket.id}`)
          
          if (currentRoom) {
            const room = rooms.get(currentRoom)
            removeUserFromRoom(currentRoom, socket.id)
            
            if (room && room.users.size > 0) {
              socket.to(currentRoom).emit('user-left', {
                username: username,
                userCount: room.users.size
              })
            }
          }
        } catch (error) {
          console.error('Error handling disconnect:', error)
        }
      })
    })
  }
  res.end()
}

export default SocketHandler
