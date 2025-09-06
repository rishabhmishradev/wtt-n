// Socket.IO Client for Real-time Communication
class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentRoom = null;
        this.username = localStorage.getItem('watch-together-username') || 'Guest';
        this.userId = this.generateUserId();
        
        // Initialize connection
        this.connect();
        
        // Bind methods
        this.setupEventHandlers();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    connect() {
        try {
            // Check if Socket.IO is available
            if (typeof io === 'undefined') {
                console.error('Socket.IO library not loaded!');
                this.initDemoMode();
                return;
            }
            
            // Use the current page's origin (includes port)
            const serverUrl = window.location.origin;
            console.log('Attempting to connect to:', serverUrl);
            
            console.log('Creating socket.io connection...');
            
            // Use different paths for development vs production
            const socketPath = window.location.hostname === 'localhost' 
                ? '/socket.io/' 
                : '/api/socket';
                
            this.socket = io(serverUrl, {
                path: socketPath,
                transports: ['websocket', 'polling'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
                forceNew: true
            });
            
            console.log('Socket.io client created, setting up events...');
            
            this.setupSocketEvents();
            
            // Connection timeout fallback
            setTimeout(() => {
                if (!this.isConnected) {
                    console.warn('Connection timeout - falling back to demo mode');
                    this.initDemoMode();
                }
            }, 5000); // 5 second timeout
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            
            // Fall back to demo mode without real synchronization
            setTimeout(() => {
                this.initDemoMode();
            }, 1000);
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.hideLoading();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.currentRoom = null;
            this.updateRoomUI();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.hideLoading();
            
            // Show specific error message
            this.showToast('Connection failed - Server may be down', 'error');
            
            // Fall back to demo mode after a delay
            setTimeout(() => {
                this.initDemoMode();
            }, 2000);
        });

        // Room events
        this.socket.on('room-joined', (data) => {
            console.log('Joined room:', data);
            this.hideLoading(); // Hide loading screen
            this.currentRoom = data.roomId;
            this.updateRoomUI();
            this.updateUserCount(data.userCount || 1);
            this.showToast(`Joined room: ${data.roomId}`, 'success');
            
            // Load current video if there is one
            if (data.currentVideo) {
                this.handleVideoLoad(data.currentVideo);
            }
        });

        this.socket.on('room-left', () => {
            console.log('Left room');
            this.currentRoom = null;
            this.updateRoomUI();
            this.showToast('Left room', 'info');
        });

        this.socket.on('user-joined', (data) => {
            this.showToast(`${data.username} joined the room`, 'info');
            this.updateUserCount(data.userCount);
        });

        this.socket.on('user-left', (data) => {
            this.showToast(`${data.username} left the room`, 'info');
            this.updateUserCount(data.userCount);
        });

        // Video synchronization events
        this.socket.on('video-action', (data) => {
            console.log('Received video action:', data);
            this.handleVideoAction(data);
        });

        this.socket.on('video-load', (data) => {
            console.log('Received video load:', data);
            this.handleVideoLoad(data);
        });

        // Chat events
        this.socket.on('chat-message', (data) => {
            this.handleChatMessage(data);
        });

        // Error events
        this.socket.on('error', (data) => {
            this.showToast(data.message || 'An error occurred', 'error');
        });
    }

    setupEventHandlers() {
        // Handle window beforeunload to clean up
        window.addEventListener('beforeunload', () => {
            if (this.socket) {
                this.socket.disconnect();
            }
        });
    }

    // Room management
    createRoom() {
        if (!this.isConnected) {
            this.showToast('Not connected to server', 'error');
            return;
        }

        this.showLoading();
        this.socket.emit('create-room', { username: this.username });
        
        // Timeout fallback - hide loading if no response in 10 seconds
        setTimeout(() => {
            if (document.getElementById('loading-overlay').style.display !== 'none') {
                this.hideLoading();
                this.showToast('Room creation timed out. Please try again.', 'error');
            }
        }, 10000);
    }

    joinRoom(roomId) {
        if (!this.isConnected) {
            this.showToast('Not connected to server', 'error');
            return;
        }

        if (!roomId || roomId.length < 3) {
            this.showToast('Please enter a valid room ID', 'error');
            return;
        }

        this.showLoading();
        this.socket.emit('join-room', { roomId, username: this.username });
        
        // Timeout fallback - hide loading if no response in 10 seconds
        setTimeout(() => {
            if (document.getElementById('loading-overlay').style.display !== 'none') {
                this.hideLoading();
                this.showToast('Join room timed out. Please try again.', 'error');
            }
        }, 10000);
    }

    leaveRoom() {
        if (!this.currentRoom) return;

        this.socket.emit('leave-room', { roomId: this.currentRoom });
    }

    // Video actions
    emitVideoAction(action, data = {}) {
        if (!this.currentRoom) return;

        const actionData = {
            roomId: this.currentRoom,
            action: action,
            ...data,
            userId: this.userId,
            timestamp: Date.now()
        };

        console.log('Emitting video action:', actionData);
        this.socket.emit('video-action', actionData);
    }

    emitVideoLoad(videoId, videoUrl) {
        if (!this.currentRoom) return;

        const loadData = {
            roomId: this.currentRoom,
            videoId: videoId,
            videoUrl: videoUrl,
            userId: this.userId,
            timestamp: Date.now()
        };

        console.log('Emitting video load:', loadData);
        this.socket.emit('video-load', loadData);
    }

    // Handle incoming video actions
    handleVideoAction(data) {
        // Don't handle our own actions
        if (data.userId === this.userId) return;

        const { action, time, timestamp } = data;
        console.log('Handling video action:', action, 'time:', time, 'timestamp:', timestamp);

        if (!window.youtubePlayer) return;

        switch (action) {
            case 'play':
                window.youtubePlayer.syncPlay(time, timestamp);
                break;
            case 'pause':
                window.youtubePlayer.syncPause(time, timestamp);
                break;
            case 'seek':
                window.youtubePlayer.syncSeek(time);
                break;
        }
    }

    handleVideoLoad(data) {
        // Don't handle our own video loads
        if (data.userId === this.userId) return;

        const { videoId, videoUrl } = data;

        if (window.youtubePlayer) {
            window.youtubePlayer.loadVideo(videoId);
            
            // Update URL input
            const urlInput = document.getElementById('video-url-input');
            urlInput.value = videoUrl;
        }
    }

    // Chat functionality
    sendChatMessage(message) {
        if (!this.currentRoom || !message.trim()) return;

        const chatData = {
            roomId: this.currentRoom,
            message: message.trim(),
            username: this.username,
            userId: this.userId,
            timestamp: Date.now()
        };

        this.socket.emit('chat-message', chatData);
    }

    handleChatMessage(data) {
        const { message, username, userId, timestamp } = data;
        const isOwn = userId === this.userId;
        
        this.addChatMessage(message, username, isOwn, new Date(timestamp));
    }

    addChatMessage(message, username, isOwn = false, timestamp = new Date()) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : ''}`;
        
        const timeStr = timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-header">${username} - ${timeStr}</div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // UI Updates
    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connection-status');
        const roomIdSpan = document.getElementById('room-id');
        
        if (connected) {
            statusIndicator.classList.add('connected');
            if (!this.currentRoom) {
                roomIdSpan.textContent = 'Connected - No room';
            }
        } else {
            statusIndicator.classList.remove('connected');
            roomIdSpan.textContent = 'Not connected';
        }
    }

    updateRoomUI() {
        const roomIdSpan = document.getElementById('room-id');
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinRoomBtn = document.getElementById('join-room-btn');
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        
        if (this.currentRoom) {
            roomIdSpan.textContent = `Room: ${this.currentRoom}`;
            createRoomBtn.style.display = 'none';
            joinRoomBtn.style.display = 'none';
            leaveRoomBtn.style.display = 'flex';
        } else {
            if (this.isConnected) {
                roomIdSpan.textContent = 'Connected - No room';
            }
            createRoomBtn.style.display = 'flex';
            joinRoomBtn.style.display = 'flex';
            leaveRoomBtn.style.display = 'none';
        }
    }

    updateUserCount(count) {
        document.getElementById('user-count').textContent = count;
    }

    // Demo mode (fallback when server is not available)
    initDemoMode() {
        console.log('Initializing demo mode');
        this.isConnected = false;
        this.updateConnectionStatus(false);
        
        // Create a simple demo room
        setTimeout(() => {
            this.currentRoom = 'demo-room';
            this.updateRoomUI();
            this.updateUserCount(1);
            this.showToast('Running in demo mode - no synchronization', 'info');
        }, 1000);
    }

    // Utility methods
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' :
                     'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove toast after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    // Getters and setters
    setUsername(username) {
        this.username = username;
        localStorage.setItem('watch-together-username', username);
    }

    getUsername() {
        return this.username;
    }

    isInRoom() {
        return !!this.currentRoom;
    }

    getRoomId() {
        return this.currentRoom;
    }
}

// Initialize socket client
window.addEventListener('DOMContentLoaded', () => {
    window.socketClient = new SocketClient();
});
