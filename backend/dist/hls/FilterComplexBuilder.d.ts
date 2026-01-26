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
     * Single user: 144p full screen (256x144)
     * Stream indices: [0:v:0] = first video stream, [0:a:0] = first audio stream
     */
    private static singleUser;
    /**
     * Two users: side-by-side (128x144 each -> 256x144 total)
     * Stream indices: [0:v:0], [0:v:1] = first and second video streams
     */
    private static twoUsers;
    /**
     * Three users: 2 on top (128x72 each), 1 centered on bottom (128x72)
     * Total canvas: 256x144
     */
    private static threeUsers;
    /**
     * Four users: 2x2 grid (128x72 each)
     * Total canvas: 256x144
     */
    private static fourUsers;
}
//# sourceMappingURL=FilterComplexBuilder.d.ts.map