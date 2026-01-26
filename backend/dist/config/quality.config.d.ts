export type QualityPreset = '144p' | '240p' | '360p' | '480p' | '720p';
export interface QualitySettings {
    name: string;
    video: {
        width: number;
        height: number;
        bitrate: string;
        maxrate: string;
        bufsize: string;
        fps: number;
        preset: 'ultrafast' | 'veryfast' | 'fast';
    };
    audio: {
        bitrate: string;
        sampleRate: number;
    };
    gop: number;
    threads: number;
}
export declare const SAFE_QUALITIES_T3_SMALL: QualityPreset[];
export declare const DEFAULT_QUALITY: QualityPreset;
/**
 * Get quality settings for a given preset
 */
export declare function getQualitySettings(quality: QualityPreset): QualitySettings;
/**
 * Get quality name for display
 */
export declare function getQualityName(quality: QualityPreset): string;
/**
 * Validate if quality is safe for t3.small
 */
export declare function isSafeQuality(quality: QualityPreset): boolean;
/**
 * Get bandwidth estimate in kbps
 */
export declare function getBandwidth(quality: QualityPreset): number;
//# sourceMappingURL=quality.config.d.ts.map