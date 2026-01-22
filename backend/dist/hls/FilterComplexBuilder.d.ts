/**
 * Builds FFmpeg filter complex strings for different grid layouts
 * Uses stream indices [0:v:0], [0:v:1] for single-input multi-stream SDP
 * Based on reference implementation pattern
 */
export declare class FilterComplexBuilder {
    /**
     * Build filter complex based on number of users
     */
    static build(userCount: number): string;
    /**
     * Single user: full screen (1280x720)
     * Stream indices: [0:v:0] = first video stream, [0:a:0] = first audio stream
     * Splits output for multi-quality encoding
     */
    private static singleUser;
    /**
     * Two users: side-by-side (640x360 each)
     * Stream indices: [0:v:0], [0:v:1] = first and second video streams
     * Splits output for multi-quality encoding
     */
    private static twoUsers;
    /**
     * Three users: 2 on top, 1 centered on bottom (640x360 each)
     * Bottom user is centered with black padding to prevent stretching
     * Splits output for multi-quality encoding
     */
    private static threeUsers;
    /**
     * Four users: 2x2 grid (640x360 each)
     * Splits output for multi-quality encoding
     */
    private static fourUsers;
}
//# sourceMappingURL=FilterComplexBuilder.d.ts.map