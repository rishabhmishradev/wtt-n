// Main Application File
class WatchTogetherApp {
    constructor() {
        this.youtubePlayer = null;
        this.socketClient = null;
        this.uiControls = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Watch Together App...');
            
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize components in order
            this.initializeYouTubePlayer();
            this.setupGlobalEventHandlers();
            this.showWelcomeMessage();
            
            console.log('Watch Together App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleInitError(error);
        }
    }

    initializeYouTubePlayer() {
        // Wait a bit to ensure DOM and other components are ready
        setTimeout(() => {
            try {
                window.youtubePlayer = new YouTubePlayer();
                this.youtubePlayer = window.youtubePlayer;
                console.log('YouTube player initialized');
            } catch (error) {
                console.error('Failed to initialize YouTube player:', error);
            }
        }, 500); // Small delay to ensure everything is ready
    }

    setupGlobalEventHandlers() {
        // Handle page visibility changes (for pausing when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden - user switched tabs');
            } else {
                console.log('Page visible - user returned to tab');
                // Could implement auto-sync here if needed
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            // Handle navigation if needed
            console.log('Navigation event:', event);
        });

        // Handle browser close/refresh
        window.addEventListener('beforeunload', (event) => {
            if (this.socketClient && this.socketClient.isInRoom()) {
                // Clean disconnect
                this.socketClient.leaveRoom();
            }
        });

        // Handle errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    showWelcomeMessage() {
        // Show initial instructions
        setTimeout(() => {
            if (window.socketClient) {
                window.socketClient.addChatMessage(
                    'Welcome to Watch Together! 🎥\n\n' +
                    '• Create or join a room to watch with friends\n' +
                    '• Paste any YouTube URL to start watching\n' +
                    '• Use keyboard shortcuts: Space/K (play/pause), ←/→ (seek), M (mute)\n' +
                    '• Chat with your friends while watching!',
                    'System',
                    false,
                    new Date()
                );
            }
        }, 1000);
    }

    handleInitError(error) {
        const errorMessage = 'Failed to initialize the app. Please refresh the page.';
        
        // Try to show error in UI
        try {
            if (window.socketClient) {
                window.socketClient.showToast(errorMessage, 'error');
            } else {
                // Fallback to basic alert
                alert(errorMessage);
            }
        } catch (e) {
            console.error('Could not show error message:', e);
        }
    }

    handleError(error) {
        console.error('App error:', error);
        
        // Show user-friendly error message
        const errorMessage = 'Something went wrong. Please try again.';
        
        if (window.socketClient) {
            window.socketClient.showToast(errorMessage, 'error');
        }
    }

    // Utility methods for debugging and development
    getState() {
        return {
            youtubePlayerReady: this.youtubePlayer?.isReady || false,
            socketConnected: this.socketClient?.isConnected || false,
            currentRoom: this.socketClient?.currentRoom || null,
            currentVideo: this.youtubePlayer?.player?.getVideoData?.() || null,
            playerState: this.youtubePlayer?.getPlayerState?.() || -1
        };
    }

    // Development helper methods
    loadSampleVideo() {
        if (this.youtubePlayer && this.youtubePlayer.isReady) {
            // Load a sample video for testing
            const sampleVideoId = 'dQw4w9WgXcQ'; // Rick Roll for testing :)
            this.youtubePlayer.loadVideo(sampleVideoId);
            
            // Update URL input
            const urlInput = document.getElementById('video-url-input');
            urlInput.value = `https://www.youtube.com/watch?v=${sampleVideoId}`;
            
            console.log('Sample video loaded for testing');
        }
    }

    // Demo mode for development without server
    enableDemoMode() {
        console.log('Enabling demo mode...');
        
        if (this.socketClient) {
            this.socketClient.initDemoMode();
        }
        
        // Add some demo chat messages
        setTimeout(() => {
            if (window.socketClient) {
                window.socketClient.addChatMessage('Demo mode is active!', 'System', false);
                window.socketClient.addChatMessage('You can still use all the video controls', 'System', false);
                window.socketClient.addChatMessage('But synchronization won\'t work without a server', 'System', false);
            }
        }, 2000);
    }

    // Health check method
    healthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            youtubePlayer: {
                initialized: !!this.youtubePlayer,
                ready: this.youtubePlayer?.isReady || false,
                hasVideo: this.youtubePlayer?.getDuration?.() > 0 || false
            },
            socketClient: {
                initialized: !!this.socketClient,
                connected: this.socketClient?.isConnected || false,
                inRoom: this.socketClient?.isInRoom?.() || false,
                roomId: this.socketClient?.getRoomId?.() || null
            },
            uiControls: {
                initialized: !!this.uiControls
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                onLine: navigator.onLine
            }
        };
        
        console.log('Health Check:', health);
        return health;
    }
}

// Global app instance
let app = null;

// Initialize app when script loads
(function() {
    console.log('Watch Together App script loaded');
    
    // Create app instance
    app = new WatchTogetherApp();
    
    // Make app globally accessible for debugging
    window.watchTogetherApp = app;
    
    // Development helpers (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.devHelpers = {
            loadSampleVideo: () => app.loadSampleVideo(),
            enableDemoMode: () => app.enableDemoMode(),
            getState: () => app.getState(),
            healthCheck: () => app.healthCheck()
        };
        
        console.log('Development helpers available: window.devHelpers');
        console.log('Available methods: loadSampleVideo(), enableDemoMode(), getState(), healthCheck()');
    }
})();

// Service Worker Registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Skip service worker for now, but this is where it would be registered
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(registrationError => console.log('SW registration failed'));
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WatchTogetherApp;
}
