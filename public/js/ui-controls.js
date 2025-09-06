// UI Controls and Event Handlers
class UIControls {
    constructor() {
        this.isProgressBarDragging = false;
        this.chatCollapsed = false;
        
        this.setupEventListeners();
        this.initializeUI();
    }

    setupEventListeners() {
        // Video controls
        this.setupVideoControls();
        
        // Room controls
        this.setupRoomControls();
        
        // Chat controls
        this.setupChatControls();
        
        // Modal controls
        this.setupModals();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupVideoControls() {
        // Load video button
        const loadVideoBtn = document.getElementById('load-video-btn');
        const videoUrlInput = document.getElementById('video-url-input');
        
        loadVideoBtn.addEventListener('click', () => {
            this.loadVideo();
        });
        
        videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadVideo();
            }
        });

        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Progress bar
        const progressBar = document.getElementById('progress-bar');
        
        progressBar.addEventListener('mousedown', () => {
            this.isProgressBarDragging = true;
        });
        
        progressBar.addEventListener('mouseup', () => {
            if (this.isProgressBarDragging) {
                this.isProgressBarDragging = false;
                this.seekToProgress();
            }
        });
        
        progressBar.addEventListener('input', () => {
            if (this.isProgressBarDragging) {
                this.updateTimeDisplay();
            }
        });

        // Volume controls
        const volumeSlider = document.getElementById('volume-slider');
        const muteBtn = document.getElementById('mute-btn');
        
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });
        
        muteBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    setupRoomControls() {
        // Create room
        const createRoomBtn = document.getElementById('create-room-btn');
        createRoomBtn.addEventListener('click', () => {
            if (window.socketClient) {
                window.socketClient.createRoom();
            }
        });

        // Join room
        const joinRoomBtn = document.getElementById('join-room-btn');
        joinRoomBtn.addEventListener('click', () => {
            this.showJoinRoomModal();
        });

        // Leave room
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        leaveRoomBtn.addEventListener('click', () => {
            if (window.socketClient) {
                window.socketClient.leaveRoom();
            }
        });

        // Change username
        const changeUsernameBtn = document.getElementById('change-username-btn');
        changeUsernameBtn.addEventListener('click', () => {
            this.showUsernameModal();
        });
    }

    setupChatControls() {
        // Send message
        const sendMessageBtn = document.getElementById('send-message-btn');
        const chatInput = document.getElementById('chat-input');
        
        sendMessageBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Toggle chat
        const toggleChatBtn = document.getElementById('toggle-chat-btn');
        toggleChatBtn.addEventListener('click', () => {
            this.toggleChat();
        });
    }

    setupModals() {
        // Username modal
        const usernameModal = document.getElementById('username-modal');
        const usernameInput = document.getElementById('username-input');
        const saveUsernameBtn = document.getElementById('save-username-btn');
        const cancelUsernameBtn = document.getElementById('cancel-username-btn');
        
        saveUsernameBtn.addEventListener('click', () => {
            this.saveUsername();
        });
        
        cancelUsernameBtn.addEventListener('click', () => {
            this.hideUsernameModal();
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveUsername();
            }
        });

        // Join room modal
        const joinRoomModal = document.getElementById('join-room-modal');
        const roomIdInput = document.getElementById('room-id-input');
        const confirmJoinBtn = document.getElementById('confirm-join-btn');
        const cancelJoinBtn = document.getElementById('cancel-join-btn');
        
        confirmJoinBtn.addEventListener('click', () => {
            this.joinRoom();
        });
        
        cancelJoinBtn.addEventListener('click', () => {
            this.hideJoinRoomModal();
        });
        
        roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        // Close modals when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAllModals();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case ' ': // Spacebar for play/pause
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'k': // K for play/pause (YouTube style)
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft': // Left arrow to seek back 10s
                    e.preventDefault();
                    this.seekRelative(-10);
                    break;
                case 'ArrowRight': // Right arrow to seek forward 10s
                    e.preventDefault();
                    this.seekRelative(10);
                    break;
                case 'm': // M to mute/unmute
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'f': // F for fullscreen
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });
    }

    initializeUI() {
        // Set initial username display
        if (window.socketClient) {
            const currentUsername = document.getElementById('current-username');
            currentUsername.textContent = window.socketClient.getUsername();
        }
        
        // Initialize chat state
        this.updateChatToggleIcon();
    }

    // Video control methods
    loadVideo() {
        const urlInput = document.getElementById('video-url-input');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showToast('Please enter a YouTube URL', 'error');
            return;
        }
        
        if (!YouTubePlayer.isValidYouTubeUrl(url)) {
            this.showToast('Please enter a valid YouTube URL', 'error');
            return;
        }
        
        const videoId = YouTubePlayer.extractVideoId(url);
        if (!videoId) {
            this.showToast('Could not extract video ID from URL', 'error');
            return;
        }
        
        // Load video locally
        if (window.youtubePlayer) {
            const success = window.youtubePlayer.loadVideo(videoId);
            
            if (success) {
                // Emit to other clients
                if (window.socketClient && window.socketClient.isInRoom()) {
                    window.socketClient.emitVideoLoad(videoId, url);
                }
                this.showToast('Video loaded successfully', 'success');
            } else {
                this.showToast('Failed to load video', 'error');
            }
        }
    }

    togglePlayPause() {
        if (!window.youtubePlayer || !window.youtubePlayer.isReady) return;
        
        const state = window.youtubePlayer.getPlayerState();
        
        if (state === YT.PlayerState.PLAYING) {
            window.youtubePlayer.userPause();
        } else {
            window.youtubePlayer.userPlay();
        }
    }

    seekToProgress() {
        if (!window.youtubePlayer || !window.youtubePlayer.isReady) return;
        
        const progressBar = document.getElementById('progress-bar');
        const duration = window.youtubePlayer.getDuration();
        const seekTime = (progressBar.value / 100) * duration;
        
        window.youtubePlayer.userSeek(seekTime);
    }

    seekRelative(seconds) {
        if (!window.youtubePlayer || !window.youtubePlayer.isReady) return;
        
        const currentTime = window.youtubePlayer.getCurrentTime();
        const duration = window.youtubePlayer.getDuration();
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        
        window.youtubePlayer.userSeek(newTime);
    }

    updateTimeDisplay() {
        if (!window.youtubePlayer) return;
        
        const progressBar = document.getElementById('progress-bar');
        const duration = window.youtubePlayer.getDuration();
        const currentTime = (progressBar.value / 100) * duration;
        
        document.getElementById('current-time').textContent = 
            window.youtubePlayer.formatTime(currentTime);
    }

    setVolume(volume) {
        if (window.youtubePlayer) {
            window.youtubePlayer.setVolume(volume);
        }
        
        // Update mute button icon
        const muteBtn = document.getElementById('mute-btn');
        const icon = muteBtn.querySelector('i');
        
        if (volume == 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    toggleMute() {
        if (!window.youtubePlayer) return;
        
        const isMuted = window.youtubePlayer.mute();
        const muteBtn = document.getElementById('mute-btn');
        const icon = muteBtn.querySelector('i');
        
        if (isMuted) {
            icon.className = 'fas fa-volume-mute';
        } else {
            const volumeSlider = document.getElementById('volume-slider');
            this.setVolume(volumeSlider.value);
        }
    }

    toggleFullscreen() {
        if (window.youtubePlayer) {
            window.youtubePlayer.toggleFullscreen();
        }
        
        // Update fullscreen button icon
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const icon = fullscreenBtn.querySelector('i');
        
        if (document.fullscreenElement) {
            icon.className = 'fas fa-compress';
        } else {
            icon.className = 'fas fa-expand';
        }
    }

    // Chat methods
    sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        if (window.socketClient && window.socketClient.isInRoom()) {
            window.socketClient.sendChatMessage(message);
            chatInput.value = '';
        } else {
            this.showToast('You must be in a room to chat', 'error');
        }
    }

    toggleChat() {
        const chatContainer = document.getElementById('chat-container');
        const toggleBtn = document.getElementById('toggle-chat-btn');
        
        this.chatCollapsed = !this.chatCollapsed;
        
        if (this.chatCollapsed) {
            chatContainer.style.display = 'none';
        } else {
            chatContainer.style.display = 'flex';
        }
        
        this.updateChatToggleIcon();
    }

    updateChatToggleIcon() {
        const toggleBtn = document.getElementById('toggle-chat-btn');
        const icon = toggleBtn.querySelector('i');
        
        if (this.chatCollapsed) {
            icon.className = 'fas fa-chevron-up';
        } else {
            icon.className = 'fas fa-chevron-down';
        }
    }

    // Modal methods
    showUsernameModal() {
        const modal = document.getElementById('username-modal');
        const input = document.getElementById('username-input');
        
        input.value = window.socketClient ? window.socketClient.getUsername() : 'Guest';
        modal.classList.add('active');
        input.focus();
    }

    hideUsernameModal() {
        const modal = document.getElementById('username-modal');
        modal.classList.remove('active');
    }

    saveUsername() {
        const input = document.getElementById('username-input');
        const username = input.value.trim();
        
        if (!username || username.length < 2) {
            this.showToast('Username must be at least 2 characters', 'error');
            return;
        }
        
        if (username.length > 20) {
            this.showToast('Username must be less than 20 characters', 'error');
            return;
        }
        
        if (window.socketClient) {
            window.socketClient.setUsername(username);
        }
        
        const currentUsername = document.getElementById('current-username');
        currentUsername.textContent = username;
        
        this.hideUsernameModal();
        this.showToast('Username updated', 'success');
    }

    showJoinRoomModal() {
        const modal = document.getElementById('join-room-modal');
        const input = document.getElementById('room-id-input');
        
        input.value = '';
        modal.classList.add('active');
        input.focus();
    }

    hideJoinRoomModal() {
        const modal = document.getElementById('join-room-modal');
        modal.classList.remove('active');
    }

    joinRoom() {
        const input = document.getElementById('room-id-input');
        const roomId = input.value.trim().toUpperCase();
        
        if (!roomId) {
            this.showToast('Please enter a room ID', 'error');
            return;
        }
        
        if (window.socketClient) {
            window.socketClient.joinRoom(roomId);
        }
        
        this.hideJoinRoomModal();
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Utility methods
    showToast(message, type = 'info') {
        if (window.socketClient) {
            window.socketClient.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize UI controls when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.uiControls = new UIControls();
});
