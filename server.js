// Node.js Server with Socket.IO for Watch Together App
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Store room information
const rooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
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
        console.log(`Room created: ${roomId}`);
    }
    return rooms.get(roomId);
}

function deleteRoom(roomId) {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        console.log(`Room deleted: ${roomId} (${room.users.size} users)`);
        rooms.delete(roomId);
    }
}

function addUserToRoom(roomId, userId, userData) {
    const room = rooms.get(roomId);
    if (room) {
        room.users.set(userId, userData);
        room.lastActivity = Date.now();
        return true;
    }
    return false;
}

function removeUserFromRoom(roomId, userId) {
    const room = rooms.get(roomId);
    if (room) {
        room.users.delete(userId);
        room.lastActivity = Date.now();
        
        // Delete room if empty
        if (room.users.size === 0) {
            setTimeout(() => {
                if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
                    deleteRoom(roomId);
                }
            }, 30000); // Delete empty rooms after 30 seconds
        }
        return true;
    }
    return false;
}

function updateRoomVideo(roomId, videoData) {
    const room = rooms.get(roomId);
    if (room) {
        room.currentVideo = videoData;
        room.lastActivity = Date.now();
        return true;
    }
    return false;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);
    
    let currentRoom = null;
    let username = 'Guest';

    // Handle room creation
    socket.on('create-room', (data) => {
        try {
            username = data.username || 'Guest';
            
            const roomId = generateRoomId();
            const room = createRoom(roomId);
            
            const userData = {
                id: socket.id,
                username: username,
                joinedAt: Date.now()
            };
            
            addUserToRoom(roomId, socket.id, userData);
            socket.join(roomId);
            currentRoom = roomId;
            
            socket.emit('room-joined', {
                roomId: roomId,
                userCount: room.users.size,
                currentVideo: room.currentVideo
            });
            
            console.log(`${username} created and joined room: ${roomId}`);
            
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', { message: 'Failed to create room' });
        }
    });

    // Handle room joining
    socket.on('join-room', (data) => {
        try {
            const { roomId, username: newUsername } = data;
            username = newUsername || 'Guest';
            
            if (!roomId) {
                socket.emit('error', { message: 'Room ID is required' });
                return;
            }
            
            // Check if room exists, create if not
            let room = rooms.get(roomId);
            if (!room) {
                room = createRoom(roomId);
            }
            
            const userData = {
                id: socket.id,
                username: username,
                joinedAt: Date.now()
            };
            
            addUserToRoom(roomId, socket.id, userData);
            socket.join(roomId);
            currentRoom = roomId;
            
            socket.emit('room-joined', {
                roomId: roomId,
                userCount: room.users.size,
                currentVideo: room.currentVideo
            });
            
            // Notify other users
            socket.to(roomId).emit('user-joined', {
                username: username,
                userCount: room.users.size
            });
            
            console.log(`${username} joined room: ${roomId}`);
            
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Handle room leaving
    socket.on('leave-room', (data) => {
        try {
            if (currentRoom) {
                const room = rooms.get(currentRoom);
                
                socket.leave(currentRoom);
                removeUserFromRoom(currentRoom, socket.id);
                
                socket.emit('room-left');
                
                // Notify other users
                if (room && room.users.size > 0) {
                    socket.to(currentRoom).emit('user-left', {
                        username: username,
                        userCount: room.users.size
                    });
                }
                
                console.log(`${username} left room: ${currentRoom}`);
                currentRoom = null;
            }
            
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });

    // Handle video actions (play, pause, seek)
    socket.on('video-action', (data) => {
        try {
            const { roomId, action, time, userId } = data;
            
            if (currentRoom && currentRoom === roomId) {
                // Broadcast to all users in the room except sender
                socket.to(roomId).emit('video-action', {
                    action: action,
                    time: time,
                    userId: userId,
                    timestamp: Date.now()
                });
                
                console.log(`Video action in ${roomId}: ${action} at ${time}s by ${username}`);
            }
            
        } catch (error) {
            console.error('Error handling video action:', error);
        }
    });

    // Handle video loading
    socket.on('video-load', (data) => {
        try {
            const { roomId, videoId, videoUrl, userId } = data;
            
            if (currentRoom && currentRoom === roomId) {
                const videoData = {
                    videoId: videoId,
                    videoUrl: videoUrl,
                    loadedBy: username,
                    loadedAt: Date.now()
                };
                
                updateRoomVideo(roomId, videoData);
                
                // Broadcast to all users in the room except sender
                socket.to(roomId).emit('video-load', {
                    videoId: videoId,
                    videoUrl: videoUrl,
                    userId: userId,
                    loadedBy: username
                });
                
                console.log(`Video loaded in ${roomId}: ${videoId} by ${username}`);
            }
            
        } catch (error) {
            console.error('Error handling video load:', error);
        }
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        try {
            const { roomId, message, username: chatUsername, userId } = data;
            
            if (currentRoom && currentRoom === roomId) {
                const chatData = {
                    message: message,
                    username: chatUsername,
                    userId: userId,
                    timestamp: Date.now()
                };
                
                // Broadcast to all users in the room (including sender)
                io.to(roomId).emit('chat-message', chatData);
                
                console.log(`Chat message in ${roomId} by ${chatUsername}: ${message}`);
            }
            
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        try {
            console.log(`User disconnected: ${socket.id}`);
            
            if (currentRoom) {
                const room = rooms.get(currentRoom);
                removeUserFromRoom(currentRoom, socket.id);
                
                // Notify other users
                if (room && room.users.size > 0) {
                    socket.to(currentRoom).emit('user-left', {
                        username: username,
                        userCount: room.users.size
                    });
                }
            }
            
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});

// API endpoints for room management
app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        userCount: room.users.size,
        hasVideo: !!room.currentVideo,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
    }));
    
    res.json({
        rooms: roomList,
        totalRooms: roomList.length
    });
});

app.get('/api/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    
    if (room) {
        res.json({
            id: room.id,
            userCount: room.users.size,
            currentVideo: room.currentVideo,
            createdAt: room.createdAt,
            lastActivity: room.lastActivity
        });
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        rooms: rooms.size,
        totalConnections: io.engine.clientsCount
    });
});

// Cleanup old rooms periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [roomId, room] of rooms.entries()) {
        if (room.users.size === 0 && (now - room.lastActivity) > maxAge) {
            deleteRoom(roomId);
        }
    }
}, 60 * 60 * 1000); // Run every hour

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server (only in development)
if (isDev) {
    server.listen(PORT, () => {
        console.log(`🚀 Watch Together server running on port ${PORT}`);
        console.log(`🌐 Open http://localhost:${PORT} in your browser`);
        console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    });
} else {
    console.log('🌟 Watch Together app ready for Vercel deployment');
}

// Export for Vercel
module.exports = app;
