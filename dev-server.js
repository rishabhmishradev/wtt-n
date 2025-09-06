// Development server for local testing
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Store room information
const rooms = new Map();

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Room utility functions
function generateRoomId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function createRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            users: new Map(),
            currentVideo: null,
            createdAt: Date.now(),
            lastActivity: Date.now()
        });
    }
    return rooms.get(roomId);
}

// Socket.IO handling
io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    
    let currentRoom = null;
    let username = 'Guest';

    socket.on('create-room', (data) => {
        username = data.username || 'Guest';
        const roomId = generateRoomId();
        const room = createRoom(roomId);
        
        room.users.set(socket.id, { id: socket.id, username, joinedAt: Date.now() });
        socket.join(roomId);
        currentRoom = roomId;
        
        socket.emit('room-joined', {
            roomId: roomId,
            userCount: room.users.size,
            currentVideo: room.currentVideo
        });
    });

    socket.on('join-room', (data) => {
        const { roomId } = data;
        username = data.username || 'Guest';
        
        let room = rooms.get(roomId) || createRoom(roomId);
        room.users.set(socket.id, { id: socket.id, username, joinedAt: Date.now() });
        
        socket.join(roomId);
        currentRoom = roomId;
        
        socket.emit('room-joined', {
            roomId: roomId,
            userCount: room.users.size,
            currentVideo: room.currentVideo
        });
        
        socket.to(roomId).emit('user-joined', {
            username: username,
            userCount: room.users.size
        });
    });

    socket.on('video-action', (data) => {
        if (currentRoom) {
            socket.to(currentRoom).emit('video-action', {
                ...data,
                timestamp: Date.now()
            });
        }
    });

    socket.on('video-load', (data) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.currentVideo = {
                    videoId: data.videoId,
                    videoUrl: data.videoUrl,
                    loadedBy: username
                };
            }
            
            socket.to(currentRoom).emit('video-load', data);
        }
    });

    socket.on('chat-message', (data) => {
        if (currentRoom) {
            io.to(currentRoom).emit('chat-message', {
                ...data,
                timestamp: Date.now()
            });
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.users.delete(socket.id);
                socket.to(currentRoom).emit('user-left', {
                    username: username,
                    userCount: room.users.size
                });
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Development server running on http://localhost:${PORT}`);
});
