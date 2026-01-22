# FFmpeg Pipeline Fix

## Issue
FFmpeg was timing out with exit code 183 because the `-filter_complex` argument was missing from the FFmpeg command.

## Root Cause
The `FFmpegProcess` class was not accepting or using the filter complex parameter, which is required to mix multiple video and audio streams into a single output.

## Fix Applied

### 1. Updated `FFmpegProcess.ts`
- Added `filterComplex` parameter to constructor
- Added `-filter_complex` argument to FFmpeg command
- Improved startup detection to look for 'hls', 'Opening', or 'muxer' in stderr

### 2. Updated `HLSManager.ts`
- Generate filter complex using `FilterComplexBuilder.build(fullProducers.length)`
- Pass filter complex to `FFmpegProcess` constructor

## Testing
Restart the server and try streaming again:
```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

The FFmpeg command should now include the filter complex and start successfully.
