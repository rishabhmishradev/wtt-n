// YouTube API Integration
class YouTubePlayer {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.isUserAction = false;
        this.lastSyncTime = 0;
        this.syncThreshold = 1; // seconds - more accurate sync
        
        // Bind methods to maintain context
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
        
        // Initialize when YouTube API is ready
        if (window.YT && window.YT.Player) {
            this.initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = this.initPlayer.bind(this);
        }
    }

    initPlayer() {
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'playsinline': 1,
                'controls': 0, // Hide YouTube controls (we'll use our own)
                'disablekb': 1,
                'fs': 1, // Enable fullscreen
                'rel': 0,
                'modestbranding': 1,
                'origin': window.location.origin
            },
            events: {
                'onReady': this.onPlayerReady,
                'onStateChange': this.onPlayerStateChange
            }
        });
    }

    onPlayerReady(event) {
        this.isReady = true;
        console.log('YouTube player ready');
        
        // Enable controls
        this.enableControls();
        
        // Set initial volume
        const volumeSlider = document.getElementById('volume-slider');
        this.player.setVolume(volumeSlider.value);
        
        // Notify that player is ready (optional - only if socket is available)
        if (window.socketClient && window.socketClient.isConnected) {
            // Socket client is ready and connected
            console.log('Notifying server that YouTube player is ready');
        }
    }

    onPlayerStateChange(event) {
        const state = event.data;
        const currentTime = this.player.getCurrentTime();
        
        // Update UI based on state
        this.updatePlayPauseButton(state);
        
        // Only emit state changes if it's a user action
        if (this.isUserAction && window.socketClient && window.socketClient.isInRoom()) {
            this.isUserAction = false;
            
            switch (state) {
                case YT.PlayerState.PLAYING:
                    console.log('🎥 USER INITIATED PLAY - Emitting to other clients at time:', currentTime);
                    window.socketClient.emitVideoAction('play', { time: currentTime });
                    break;
                case YT.PlayerState.PAUSED:
                    console.log('⏸️ USER INITIATED PAUSE - Emitting to other clients at time:', currentTime);
                    window.socketClient.emitVideoAction('pause', { time: currentTime });
                    break;
            }
        } else {
            console.log('🔄 State change:', state, 'isUserAction:', this.isUserAction, 'inRoom:', window.socketClient?.isInRoom());
        }
        
        // Update progress for all state changes
        this.updateProgress();
    }

    updatePlayPauseButton(state) {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const icon = playPauseBtn.querySelector('i');
        
        if (state === YT.PlayerState.PLAYING) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    enableControls() {
        document.getElementById('play-pause-btn').disabled = false;
        document.getElementById('progress-bar').disabled = false;
    }

    disableControls() {
        document.getElementById('play-pause-btn').disabled = true;
        document.getElementById('progress-bar').disabled = true;
    }

    loadVideo(videoId) {
        if (!this.isReady) {
            console.error('Player not ready');
            return false;
        }

        try {
            this.player.loadVideoById(videoId);
            
            // Show player, hide placeholder
            document.getElementById('video-placeholder').style.display = 'none';
            document.getElementById('youtube-player').style.display = 'block';
            
            return true;
        } catch (error) {
            console.error('Error loading video:', error);
            return false;
        }
    }

    // Synchronized playback controls
    syncPlay(time = null, timestamp = null) {
        if (!this.isReady) return;
        
        // Debug log
        console.log('📥 RECEIVED PLAY SYNC:', { time, timestamp });
        
        try {
            console.log('Syncing play:', { time, timestamp, currentTime: this.getCurrentTime() });
            
            // Calculate time offset if timestamp is provided
            let targetTime = time;
            if (time !== null && timestamp) {
                const timeDiff = (Date.now() - timestamp) / 1000; // Convert to seconds
                targetTime = time + timeDiff;
                console.log('Adjusted target time:', targetTime, 'offset:', timeDiff);
            }
            
            // Seek to the target time if there's a significant difference
            if (targetTime !== null) {
                const currentTime = this.player.getCurrentTime();
                if (Math.abs(currentTime - targetTime) > this.syncThreshold) {
                    console.log('Seeking to:', targetTime, 'from:', currentTime);
                    this.player.seekTo(targetTime, true);
                }
            }
            
            // Always play the video
            if (this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
                console.log('Starting playback');
                this.player.playVideo();
            }
            
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('Error in syncPlay:', error);
        }
    }

    syncPause(time = null, timestamp = null) {
        if (!this.isReady) return;
        
        // Debug log
        console.log('📥 RECEIVED PAUSE SYNC:', { time, timestamp });
        
        try {
            console.log('Syncing pause:', { time, timestamp, currentTime: this.getCurrentTime() });
            
            // For pause, we don't add time offset since video should be paused at exact time
            if (time !== null) {
                const currentTime = this.player.getCurrentTime();
                if (Math.abs(currentTime - time) > this.syncThreshold) {
                    console.log('Seeking to pause position:', time, 'from:', currentTime);
                    this.player.seekTo(time, true);
                }
            }
            
            if (this.player.getPlayerState() !== YT.PlayerState.PAUSED) {
                console.log('Pausing video');
                this.player.pauseVideo();
            }
            
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('Error in syncPause:', error);
        }
    }

    syncSeek(time) {
        if (!this.isReady) return;
        
        try {
            this.player.seekTo(time, true);
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('Error in syncSeek:', error);
        }
    }

    // User-initiated actions
    userPlay() {
        if (!this.isReady) return;
        
        this.isUserAction = true;
        this.player.playVideo();
    }

    userPause() {
        if (!this.isReady) return;
        
        this.isUserAction = true;
        this.player.pauseVideo();
    }

    userSeek(time) {
        if (!this.isReady) return;
        
        this.isUserAction = true;
        this.player.seekTo(time, true);
        
        // Emit seek action immediately
        if (window.socketClient) {
            window.socketClient.emitVideoAction('seek', { time: time });
        }
    }

    // Utility methods
    getCurrentTime() {
        return this.isReady ? this.player.getCurrentTime() : 0;
    }

    getDuration() {
        return this.isReady ? this.player.getDuration() : 0;
    }

    getPlayerState() {
        return this.isReady ? this.player.getPlayerState() : -1;
    }

    setVolume(volume) {
        if (this.isReady) {
            this.player.setVolume(volume);
        }
    }

    mute() {
        if (this.isReady) {
            if (this.player.isMuted()) {
                this.player.unMute();
                return false;
            } else {
                this.player.mute();
                return true;
            }
        }
        return false;
    }

    // Progress tracking
    updateProgress() {
        if (!this.isReady) return;
        
        const currentTime = this.getCurrentTime();
        const duration = this.getDuration();
        const progressBar = document.getElementById('progress-bar');
        
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            progressBar.value = progress;
        }
        
        // Update time display
        document.getElementById('current-time').textContent = this.formatTime(currentTime);
        document.getElementById('duration').textContent = this.formatTime(duration);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Fullscreen functionality
    toggleFullscreen() {
        const videoContainer = document.getElementById('youtube-player').parentElement;
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // Extract video ID from YouTube URL
    static extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    // Validate YouTube URL
    static isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
        return pattern.test(url);
    }
}

// Initialize progress tracking
let progressInterval = null;

function startProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
        if (window.youtubePlayer) {
            window.youtubePlayer.updateProgress();
        }
    }, 1000);
}

function stopProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Start progress tracking when the page loads
window.addEventListener('load', () => {
    startProgressTracking();
});

// Export for global use
window.YouTubePlayer = YouTubePlayer;
