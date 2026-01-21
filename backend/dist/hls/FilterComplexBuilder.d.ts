/**
 * Builds FFmpeg filter complex strings for different grid layouts
 * Handles 1-4 users with appropriate video layouts and audio mixing
 */
export declare class FilterComplexBuilder {
    /**
     * Build filter complex based on number of users
     */
    static build(userCount: number): string;
    /**
     * Single user: full screen (1280x720)
     */
    private static singleUser;
    /**
     * Two users: side-by-side (640x720 each)
     */
    private static twoUsers;
    /**
     * Three users: 2 on top, 1 on bottom (640x360 each)
     */
    private static threeUsers;
    /**
     * Four users: 2x2 grid (640x360 each)
     */
    private static fourUsers;
}
//# sourceMappingURL=FilterComplexBuilder.d.ts.map