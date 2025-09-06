# 🎥 Watch Together App

A real-time web application that allows you to watch YouTube videos synchronously with your friends. Features include synchronized play, pause, and seek controls, along with a built-in chat system.

## ✨ Features

- **🎬 YouTube Integration**: Watch any YouTube video by pasting the URL
- **⚡ Real-time Synchronization**: Play, pause, and seek actions are synced across all viewers
- **💬 Live Chat**: Chat with friends while watching videos
- **🏠 Room System**: Create or join rooms with unique IDs
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **⌨️ Keyboard Shortcuts**: YouTube-style keyboard controls
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/codewithrishabh/projects/watch-together-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## 🎮 How to Use

1. **Set your username** by clicking the user icon in the header
2. **Create a room** or **join an existing room** using a room ID
3. **Load a video** by pasting a YouTube URL
4. **Watch together** - all play, pause, and seek actions are synchronized
5. **Chat** with other viewers in real-time

## ⌨️ Keyboard Shortcuts

- **Spacebar** or **K**: Play/Pause
- **← Left Arrow**: Seek backward 10 seconds
- **→ Right Arrow**: Seek forward 10 seconds  
- **M**: Mute/Unmute
- **Enter**: Send chat message (when chat input is focused)

## 🛠️ Project Structure

```
watch-together-app/
├── index.html              # Main HTML file
├── server.js               # Node.js server with Socket.IO
├── package.json            # Dependencies and scripts
├── README.md               # This file
├── css/
│   └── styles.css          # Main stylesheet
└── js/
    ├── app.js              # Main application logic
    ├── youtube-api.js      # YouTube Player API integration
    ├── socket-client.js    # Socket.IO client for real-time communication
    └── ui-controls.js      # UI event handlers and controls
```

## 🔧 Technical Features

### Frontend Technologies
- **HTML5** with semantic elements
- **CSS3** with modern features (Grid, Flexbox, Animations)
- **Vanilla JavaScript** (ES6+)
- **YouTube IFrame Player API** for video control
- **Socket.IO Client** for real-time communication
- **Responsive Design** with mobile-first approach

### Backend Technologies
- **Node.js** with Express.js
- **Socket.IO** for WebSocket communication
- **CORS** enabled for cross-origin requests
- **Real-time room management**
- **Automatic cleanup** of inactive rooms

### Key Features Implementation
- **Video Synchronization**: Uses timestamps and buffering to ensure all users stay in sync
- **Room Management**: Unique room IDs with user tracking
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Demo Mode**: Works offline for testing without a server

## 📡 API Endpoints

- `GET /` - Main application
- `GET /api/health` - Server health check
- `GET /api/rooms` - List all active rooms
- `GET /api/room/:roomId` - Get specific room information

## 🎯 Socket.IO Events

### Client → Server
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `leave-room` - Leave current room
- `video-action` - Send video control action (play/pause/seek)
- `video-load` - Load a new video
- `chat-message` - Send a chat message

### Server → Client
- `room-joined` - Successful room join
- `room-left` - Successfully left room  
- `user-joined` - Another user joined
- `user-left` - Another user left
- `video-action` - Received video control action
- `video-load` - New video loaded
- `chat-message` - New chat message
- `error` - Error occurred

## 🚀 Deployment

### Local Development
The app runs on `http://localhost:3000` by default.

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Or deploy via Git**:
   - Push to GitHub
   - Connect repository to Vercel
   - Auto-deploy on push

### Other Deployment Options

1. **Deploy to Heroku**:
   - Create a Heroku app
   - Set the PORT environment variable
   - Deploy using git

2. **Deploy to Railway/Render**:
   - Similar to Heroku with automatic deployments

3. **Deploy to VPS**:
   - Use PM2 or similar process manager
   - Set up reverse proxy with Nginx
   - Configure SSL certificates

## 🔒 Security Considerations

- Input sanitization for chat messages
- Rate limiting for socket events
- Room cleanup to prevent memory leaks
- CORS configuration for production

## 🐛 Troubleshooting

### Common Issues

1. **Video won't load**:
   - Check if the YouTube URL is valid
   - Ensure the video is not restricted in your region
   - Try a different video

2. **Sync issues**:
   - Check internet connection
   - Refresh the page
   - Rejoin the room

3. **Connection problems**:
   - Ensure the server is running
   - Check for firewall/proxy issues
   - Try accessing via localhost

### Development Debugging

Access development helpers in the browser console:
```javascript
// Load a sample video for testing
window.devHelpers.loadSampleVideo();

// Enable demo mode
window.devHelpers.enableDemoMode();

// Check app state
window.devHelpers.getState();

// Health check
window.devHelpers.healthCheck();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **YouTube IFrame Player API** for video integration
- **Socket.IO** for real-time communication
- **Font Awesome** for icons
- **Google Fonts** for typography

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Look at the browser console for error messages
3. Check the server logs
4. Create an issue in the repository

---

**Enjoy watching videos together! 🍿**
