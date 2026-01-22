# WebRTC + HLS Streaming Application

A full-stack application for real-time video streaming using WebRTC (Mediasoup) and HLS playback.

## Features

- **WebRTC Streaming** (`/stream`): 2-4 users can stream video/audio in real-time
- **HLS Playback** (`/watch`): Viewers can watch the live stream via HLS with 5-10s latency
- **Automatic Grid Layout**: FFmpeg dynamically creates grid layouts for 1-4 users
- **Graceful Restart**: HLS pipeline restarts smoothly when users join/leave
- **Keyframe Retry**: Fast HLS startup with automatic keyframe requests

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   /stream   │────▶│  Mediasoup   │────▶│   /watch    │
│  (WebRTC)   │     │   (Router)   │     │   (HLS)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ HLS Pipeline │
                    │   (FFmpeg)   │
                    └──────────────┘
```

## Prerequisites

- **Node.js** 18+ 
- **FFmpeg** with libx264 and aac support
- **Modern browser** with WebRTC support

### Install FFmpeg

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

## Installation

1. **Clone and navigate to project**
```bash
cd media-soup
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies  
cd frontend && npm install && cd ..
```

## Running the Application

### Option 1: Run both frontend and backend together
```bash
npm run dev
```

### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **HLS files**: http://localhost:3000/hls

## Usage

### Streaming (Producer)

1. Open http://localhost:5173/stream
2. Allow camera and microphone permissions
3. Click **"Start Streaming"**
4. Note the **Room ID** displayed
5. Share the Room ID with others to join

### Watching (Consumer)

1. Open http://localhost:5173/watch
2. Enter the **Room ID** from a streaming session
3. Click **"Start Watching"**
4. The HLS stream will start playing (5-10s latency)

### Testing with Multiple Users

1. **User 1**: Open `/stream` in normal browser window
2. **User 2**: Open `/stream` in incognito/private window
3. **Viewer**: Open `/watch` in another tab and enter the Room ID

## Project Structure

```
media-soup/
├── backend/                     # Node.js + TypeScript
│   ├── src/
│   │   ├── server.ts           # Express + Socket.IO entry
│   │   ├── config/             # Mediasoup configuration
│   │   ├── mediasoup/          # Worker, router, transport
│   │   ├── hls/                # HLS pipeline (FFmpeg)
│   │   ├── signaling/          # Socket.IO handlers
│   │   ├── state/              # Room management
│   │   └── utils/              # Logger, errors
│   └── public/hls/             # Generated HLS files
│
├── frontend/                    # Vite + React + TypeScript
│   ├── src/
│   │   ├── pages/              # Stream, Watch
│   │   ├── hooks/              # useMediasoup, useHLS
│   │   ├── components/         # MediaControls, VideoGrid
│   │   └── utils/              # Logger
│
└── package.json                # Monorepo root
```

## Key Technologies

**Backend:**
- Mediasoup (WebRTC SFU)
- Express + Socket.IO (Signaling)
- FFmpeg (HLS transcoding)
- TypeScript

**Frontend:**
- React + Vite
- mediasoup-client (WebRTC)
- HLS.js (Video playback)
- Socket.IO client

## How It Works

### WebRTC Flow (/stream)

1. Client connects via Socket.IO
2. Creates/joins a room
3. Gets router RTP capabilities
4. Creates producer transport (DTLS handshake)
5. Produces video and audio tracks
6. Server adds producer to room

### HLS Pipeline

1. When producers join, server:
   - Allocates RTP/RTCP ports
   - Creates PlainTransports
   - Generates SDP file
   - Starts FFmpeg with grid layout
   - Creates consumers for each producer
   - Requests keyframes for fast startup

2. FFmpeg outputs HLS segments to `/public/hls/{roomId}/`

3. Viewers load `playlist.m3u8` via HLS.js

### Grid Layouts

- **1 user**: Full screen (1280x720)
- **2 users**: Side-by-side (640x720 each)
- **3 users**: 2 top + 1 bottom (640x360 grid)
- **4 users**: 2x2 grid (640x360 each)

## Troubleshooting

### FFmpeg not found
```bash
# Verify FFmpeg is in PATH
which ffmpeg

# If not, install FFmpeg (see Prerequisites)
```

### Port already in use
```bash
# Change ports in:
# - backend/src/server.ts (PORT)
# - frontend/src/hooks/useMediasoup.ts (SOCKET_URL)
```

### Camera/Microphone not working
- Ensure HTTPS or localhost (required for getUserMedia)
- Check browser permissions
- Try different browser (Chrome/Firefox recommended)

### HLS stream not playing
- Wait 5-10 seconds for FFmpeg to start
- Check browser console for errors
- Verify FFmpeg is running: `ps aux | grep ffmpeg`
- Check HLS files exist: `ls backend/public/hls/{roomId}/`

## Performance

- **2-3 users**: ~40-80% CPU (single core)
- **4 users**: ~80-100% CPU
- **5+ users**: Consider hardware encoding (NVENC) or architecture change

## Limitations

- Optimized for 2-4 concurrent streamers
- HLS has 5-10 second latency (inherent to HLS)
- No authentication or room security
- Single server (no horizontal scaling)

## Future Improvements

- [ ] Active speaker detection
- [ ] Multiple HLS quality levels (ABR)
- [ ] Recording individual streams
- [ ] Redis for state management (horizontal scaling)
- [ ] Low-latency HLS (LL-HLS)
- [ ] Authentication and room passwords

## License

ISC

## Author

Built for Fermion assignment
