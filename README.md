# Mediasoup SFU & HLS Streaming Server

This project is a robust, scalable SFU (Selective Forwarding Unit) backend using **Mediasoup** and **Socket.IO**, coupled with a React frontend. It manages real-time audio/video rooms and outputs a low-latency HLS stream via FFmpeg.

## 🚀 Key Features

- **Real-time WebRTC**: Low-latency video conferencing for up to 5-8 peers.
- **HLS Broadcast**: Live streaming to unlimited passive viewers via HLS (HTTP Live Streaming).
- **144p Optimization**: Specialized "Low Bandwidth" mode featuring:
    - Direct FFmpeg scaling to 144p.
    - Single-core thread pinning for stable performance on `t3.small` instances.
    - Minimal resource footprint.
- **Robust Signaling**: Type-safe Socket.IO implementation with strict state management.
- **Auto-Healing Pipeline**: Automatic keyframe requests and process recovery for glitch-free HLS.

---

## 🏗️ Architecture

The system is composed of two main parts: the **Signaling/Media Server** (Backend) and the **Client Application** (Frontend).

### Request/Response Signaling Cycle

The backend enforces a strict request/response cycle for all signaling events to ensure state consistency.

| Event | Direction | Description | Typical Response |
| :--- | :--- | :--- | :--- |
| `createRoom` | Client → Server | Create a new media room | `{ roomId }` |
| `joinRoom` | Client → Server | Join an existing media room | `{ roomId, rtpCapabilities }` |
| `createProducerTransport` | Client → Server | Request a transport for sending media | `{ id, iceParameters, ... }` |
| `connectProducerTransport` | Client → Server | DTLS handshake for producer transport | `{ connected: true }` |
| `produce` | Client → Server | Start sending a media track | `{ id: producerId }` |
| `createConsumerTransport` | Client → Server | Request a transport for receiving media | `{ id, iceParameters, ... }` |
| `consume` | Client → Server | Create a consumer for a remote producer | Consumer parameters |
| `roomProducersChanged` | Server → Client | Notification of new/removed producers | *Event only* |

### Why Maintain Execution Order (Pipeline)?

**The correct execution order is critical for a robust SFU-HLS pipeline**. For media and HLS output to work without glitches, resource leaks, or race conditions, each step must be performed in a strict sequence:

#### Summary: Why This Pipeline is Robust

*   **Strict resource cleanup** prevents leaks and port conflicts.
*   **Atomic state changes** avoid race conditions, even with concurrent join/leave or produce/stop events.
*   **Strict port allocation and SDP writing order** ensures FFmpeg and Mediasoup always agree on stream layout.
*   **Keyframe request retries** guarantee immediate, glitch-free HLS startup.
*   **All signaling events** are request/response and type-safe, minimizing protocol drift and client/server desync.

#### Detailed HLS Pipeline Steps

To ensure robustness and avoid race conditions (like "black video" or stuck processes), the system follows this strict atomic sequence during every room restart:

1.  **Cleanup Old State**
    Terminate any existing FFmpeg process and close old Mediasoup transports. This frees up UDP ports and CPU resources.

2.  **Allocate Ports**
    Assign unique RTP/RTCP ports for the new set of users. These ports are reserved before anything else starts.

3.  **Create Transports & Connect**
    Create Mediasoup `PlainTransports` and immediately `connect()` them to the allocated local ports.
    *Note: At this stage, no media flows yet because consumers haven't been created.*

4.  **Create Consumers (Paused)**
    Create consumers for each user's video/audio tracks, but keep them **PAUSED**.
    *Why?* This ensures we have the track metadata to generate a valid SDP, but we don't flood the UDP ports until FFmpeg is listening.

5.  **Generate SDP**
    Write a tailored SDP file that describes exactly which codecs and SSRCs FFmpeg should expect on which ports.

6.  **Launch FFmpeg**
    Spawn the FFmpeg process using the generated SDP. It instantly binds to the allocated ports.

7.  **Resume & Request Keyframes**
    Once FFmpeg is running, we **resume** the consumers. Data begins to flow.
    We immediately send a `requestKeyFrame` command (with retries) to force a fresh video frame, ensuring instant playback start.

8.  **Update State**
    Mark the pipeline as active.

> **Robustness Note**: Unlike some implementations that connect transports *after* FFmpeg starts, we use a **"Connect then Resume"** pattern. By creating consumers in a `paused` state, we prepare the entire topology without dropping a single packet, then "open the floodgates" only when the transcoder is ready.

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** 18+
- **FFmpeg** (v4+ with libx264/aac support)
- **Docker** (Optional, for containerized run)

### Local Development

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd media-soup
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    cd backend && npm install
    cd ../frontend && npm install
    ```

3.  **Start Services**
    *In terminal 1 (Backend):*
    ```bash
    cd backend
    # Create necessary HLS directory
    mkdir -p public/hls
    npm run dev
    ```
    *In terminal 2 (Frontend):*
    ```bash
    cd frontend
    npm run dev
    ```

4.  **Access App**
    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:3000`

### Docker Deployment

For production (or testing the `144p` optimization), use Docker Compose.

```bash
# Build and run
docker compose up --build -d
```

> **Note**: The `docker-compose.yml` is configured to use `network_mode: host` to simplify WebRTC port management.

---

## 🔧 144p Optimization Details

This branch (`144p-quality`) implements specific optimizations for low-resource environments (like AWS `t3.small`):

- **Filter Complex**: Layouts are calculated to result in a native **256x144** output canvas.
- **Thread Pinning**: FFmpeg is forced to run with `-threads 1`. This reduces context switching overhead on small CPUs, as 144p encoding is lightweight enough for a single thread.
- **Direct Scaling**: Inputs are downscaled immediately upon ingress (`scale=128:72`) before being composed, drastically reducing memory bandwidth.

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── hls/           # FFmpeg process & SDP generation
│   │   ├── mediasoup/     # Router & Worker management
│   │   ├── signaling/     # Socket.IO event handlers
│   │   └── server.ts      # Entry point
│   └── public/hls/        # HLS segments storage
├── frontend/
│   ├── src/
│   │   ├── components/    # UI Components (HLSPlayer, etc.)
│   │   ├── hooks/         # Mediasoup & Socket logic
│   │   └── pages/         # Stream & Watch pages
└── docker-compose.yml
```

## 📜 License
ISC
