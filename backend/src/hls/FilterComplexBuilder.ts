/**
 * Builds FFmpeg filter complex strings for different grid layouts
 * Uses stream indices [0:v:0], [0:v:1] for single-input multi-stream SDP
 * Based on reference implementation pattern
 */
export class FilterComplexBuilder {
    /**
     * Build filter complex based on number of users
     */
    static build(userCount: number): string {
        switch (userCount) {
            case 1:
                return this.singleUser();
            case 2:
                return this.twoUsers();
            case 3:
                return this.threeUsers();
            case 4:
                return this.fourUsers();
            default:
                throw new Error(`Unsupported user count: ${userCount}`);
        }
    }

    /**
     * Single user: full screen (1280x720)
     * Stream indices: [0:v:0] = first video stream, [0:a:0] = first audio stream
     */
    private static singleUser(): string {
        return `
      [0:v:0]scale=1280:720[vout];
      [0:a:0]anull[aout]
    `.trim();
    }

    /**
     * Two users: side-by-side (640x720 each)
     * Stream indices: [0:v:0], [0:v:1] = first and second video streams
     */
    private static twoUsers(): string {
        return `
      [0:v:0]scale=640:720[v0];
      [0:v:1]scale=640:720[v1];
      [v0][v1]hstack[vout];
      [0:a:0][0:a:1]amix=inputs=2:duration=longest[aout]
    `.trim();
    }

    /**
     * Three users: 2 on top, 1 on bottom (640x360 each)
     */
    private static threeUsers(): string {
        return `
      [0:v:0]scale=640:360[v0];
      [0:v:1]scale=640:360[v1];
      [0:v:2]scale=1280:360[v2];
      [v0][v1]hstack[top];
      [top][v2]vstack[vout];
      [0:a:0][0:a:1][0:a:2]amix=inputs=3:duration=longest[aout]
    `.trim();
    }

    /**
     * Four users: 2x2 grid (640x360 each)
     */
    private static fourUsers(): string {
        return `
      [0:v:0]scale=640:360[v0];
      [0:v:1]scale=640:360[v1];
      [0:v:2]scale=640:360[v2];
      [0:v:3]scale=640:360[v3];
      [v0][v1]hstack[top];
      [v2][v3]hstack[bottom];
      [top][bottom]vstack[vout];
      [0:a:0][0:a:1][0:a:2][0:a:3]amix=inputs=4:duration=longest[aout]
    `.trim();
    }
}
