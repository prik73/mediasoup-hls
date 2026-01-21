// Custom error classes for better error handling
export class PortAllocationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PortAllocationError';
    }
}

export class FFmpegStartError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FFmpegStartError';
    }
}

export class TransportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransportError';
    }
}

export class RoomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RoomError';
    }
}
