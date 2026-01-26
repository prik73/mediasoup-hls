const QUALITY_PRESETS = {
    '144p': {
        name: '144p Ultra-Minimal',
        video: {
            width: 256,
            height: 144,
            bitrate: '250k',
            maxrate: '350k',
            bufsize: '700k',
            fps: 15,
            preset: 'ultrafast',
        },
        audio: {
            bitrate: '64k',
            sampleRate: 48000,
        },
        gop: 30,
        threads: 0, // auto
    },
    '240p': {
        name: '240p Economy',
        video: {
            width: 426,
            height: 240,
            bitrate: '400k',
            maxrate: '600k',
            bufsize: '1200k',
            fps: 15,
            preset: 'ultrafast',
        },
        audio: {
            bitrate: '96k',
            sampleRate: 48000,
        },
        gop: 30,
        threads: 0,
    },
    '360p': {
        name: '360p Standard',
        video: {
            width: 640,
            height: 360,
            bitrate: '800k',
            maxrate: '1000k',
            bufsize: '2000k',
            fps: 24,
            preset: 'ultrafast',
        },
        audio: {
            bitrate: '96k',
            sampleRate: 48000,
        },
        gop: 48,
        threads: 0,
    },
    '480p': {
        name: '480p Good',
        video: {
            width: 854,
            height: 480,
            bitrate: '1200k',
            maxrate: '1500k',
            bufsize: '3000k',
            fps: 24,
            preset: 'veryfast',
        },
        audio: {
            bitrate: '128k',
            sampleRate: 48000,
        },
        gop: 48,
        threads: 2,
    },
    '720p': {
        name: '720p HD',
        video: {
            width: 1280,
            height: 720,
            bitrate: '2500k',
            maxrate: '3000k',
            bufsize: '6000k',
            fps: 24,
            preset: 'veryfast',
        },
        audio: {
            bitrate: '128k',
            sampleRate: 48000,
        },
        gop: 60,
        threads: 4,
    },
};
// Safe quality options for t3.small instances
export const SAFE_QUALITIES_T3_SMALL = ['144p', '240p', '360p'];
// Default quality preset
export const DEFAULT_QUALITY = '240p';
/**
 * Get quality settings for a given preset
 */
export function getQualitySettings(quality) {
    const settings = QUALITY_PRESETS[quality];
    if (!settings) {
        throw new Error(`Invalid quality preset: ${quality}`);
    }
    return settings;
}
/**
 * Get quality name for display
 */
export function getQualityName(quality) {
    return getQualitySettings(quality).name;
}
/**
 * Validate if quality is safe for t3.small
 */
export function isSafeQuality(quality) {
    return SAFE_QUALITIES_T3_SMALL.includes(quality);
}
/**
 * Get bandwidth estimate in kbps
 */
export function getBandwidth(quality) {
    const settings = getQualitySettings(quality);
    const videoBitrate = parseInt(settings.video.bitrate.replace('k', ''));
    const audioBitrate = parseInt(settings.audio.bitrate.replace('k', ''));
    return videoBitrate + audioBitrate;
}
//# sourceMappingURL=quality.config.js.map