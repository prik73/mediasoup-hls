import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../state/types.js';
/**
 * Setup Socket.IO event handlers
 */
export declare function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>): void;
//# sourceMappingURL=socketHandlers.d.ts.map