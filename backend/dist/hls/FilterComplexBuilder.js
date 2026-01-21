/**
 * Builds FFmpeg filter complex strings for different grid layouts
 * Handles 1-4 users with appropriate video layouts and audio mixing
 */
export class FilterComplexBuilder {
    /**
     * Build filter complex based on number of users
     */
    static build(userCount) {
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
     */
    static singleUser() {
        return `
      [0:v]scale=1280:720[vout];
      [0:a]anull[aout]
    `.trim();
    }
    /**
     * Two users: side-by-side (640x720 each)
     */
    static twoUsers() {
        return `
      [0:v]scale=640:720[v0];
      [1:v]scale=640:720[v1];
      [v0][v1]hstack[vout];
      [0:a][1:a]amix=inputs=2:duration=longest[aout]
    `.trim();
    }
    /**
     * Three users: 2 on top, 1 on bottom (640x360 each)
     */
    static threeUsers() {
        return `
      [0:v]scale=640:360[v0];
      [1:v]scale=640:360[v1];
      [2:v]scale=1280:360[v2];
      [v0][v1]hstack[top];
      [top][v2]vstack[vout];
      [0:a][1:a][2:a]amix=inputs=3:duration=longest[aout]
    `.trim();
    }
    /**
     * Four users: 2x2 grid (640x360 each)
     */
    static fourUsers() {
        return `
      [0:v]scale=640:360[v0];
      [1:v]scale=640:360[v1];
      [2:v]scale=640:360[v2];
      [3:v]scale=640:360[v3];
      [v0][v1]hstack[top];
      [v2][v3]hstack[bottom];
      [top][bottom]vstack[vout];
      [0:a][1:a][2:a][3:a]amix=inputs=4:duration=longest[aout]
    `.trim();
    }
}
//# sourceMappingURL=FilterComplexBuilder.js.map