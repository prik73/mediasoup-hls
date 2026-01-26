/**
 * Builds FFmpeg filter complex strings for different grid layouts
 * Uses stream indices [0:v:0], [0:v:1] for single-input multi-stream SDP
 * Based on reference implementation pattern
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
     * Single user: 144p full screen (256x144)
     * Stream indices: [0:v:0] = first video stream, [0:a:0] = first audio stream
     */
    static singleUser() {
        return `
      [0:v:0]scale=256:144[vtemp];
      [vtemp]copy[vout0];
      [0:a:0]acopy[aout0]
    `.trim();
    }
    /**
     * Two users: side-by-side (128x144 each -> 256x144 total)
     * Stream indices: [0:v:0], [0:v:1] = first and second video streams
     */
    static twoUsers() {
        return `
      [0:v:0]scale=128:144[v0];
      [0:v:1]scale=128:144[v1];
      [v0][v1]hstack[vtemp];
      [vtemp]copy[vout0];
      [0:a:0][0:a:1]amix=inputs=2:duration=longest[atemp];
      [atemp]acopy[aout0]
    `.trim();
    }
    /**
     * Three users: 2 on top (128x72 each), 1 centered on bottom (128x72)
     * Total canvas: 256x144
     */
    static threeUsers() {
        return `
      [0:v:0]scale=128:72[v0];
      [0:v:1]scale=128:72[v1];
      [0:v:2]scale=128:72[v2];
      [v0][v1]hstack[top];
      [v2]pad=256:72:(ow-iw)/2:0:black[v2_padded];
      [top][v2_padded]vstack[vtemp];
      [vtemp]copy[vout0];
      [0:a:0][0:a:1][0:a:2]amix=inputs=3:duration=longest[atemp];
      [atemp]acopy[aout0]
    `.trim();
    }
    /**
     * Four users: 2x2 grid (128x72 each)
     * Total canvas: 256x144
     */
    static fourUsers() {
        return `
      [0:v:0]scale=128:72[v0];
      [0:v:1]scale=128:72[v1];
      [0:v:2]scale=128:72[v2];
      [0:v:3]scale=128:72[v3];
      [v0][v1]hstack[top];
      [v2][v3]hstack[bottom];
      [top][bottom]vstack[vtemp];
      [vtemp]copy[vout0];
      [0:a:0][0:a:1][0:a:2][0:a:3]amix=inputs=4:duration=longest[atemp];
      [atemp]acopy[aout0]
    `.trim();
    }
}
//# sourceMappingURL=FilterComplexBuilder.js.map