import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorker } from './mediasoup/worker.js';
import { setupSocketHandlers } from './signaling/socketHandlers.js';
import { logger } from './utils/logger.js';
import type { ServerToClientEvents, ClientToServerEvents } from './state/types.js';
import { HLSManager } from './hls/HLSManager.js';
import { roomManager } from './state/RoomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function main() {
    // Initialize Express app
    const app = express();
    const httpServer = createServer(app);

    // Setup CORS
    const allowedOrigins = process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:5173']
        : ['http://localhost:5173'];

    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));

    // Serve static files (HLS output)
    app.use('/hls', express.static(path.join(__dirname, '../public/hls')));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Clean up previous HLS sessions and zombie processes
    await HLSManager.cleanupAll();

    // Auto-detect public IP for MediaSoup if not set (CRITICAL for AWS/VPS)
    if (!process.env.MEDIASOUP_ANNOUNCED_IP) {
        logger.info('Detecting public IP...');
        try {
            const https = await import('https');
            const publicIp = await new Promise<string>((resolve, reject) => {
                const req = https.get('https://api.ipify.org', (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => resolve(data.trim()));
                });
                req.on('error', reject);
                req.end();
            });

            if (publicIp) {
                process.env.MEDIASOUP_ANNOUNCED_IP = publicIp;
                logger.info(`Auto-detected Public IP: ${publicIp}`);
            }
        } catch (error) {
            logger.warn('Failed to auto-detect public IP, using default 127.0.0.1:', error);
        }
    }

    // Initialize Mediasoup worker
    logger.info('Initializing Mediasoup worker...');
    await createWorker();
    logger.info('Mediasoup worker initialized');

    // Setup Socket.IO
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    // Setup Socket.IO handlers
    setupSocketHandlers(io);
    roomManager.setIO(io); // Pass io to RoomManager for HLS events
    logger.info('Socket.IO handlers setup complete');

    // Start server
    httpServer.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
        logger.info(`HLS files served at http://localhost:${PORT}/hls`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        logger.info('Shutting down gracefully...');
        httpServer.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    });
}

// Start the server
main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
});
