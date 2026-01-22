# FFmpeg Not Generating HLS Files - Debugging Guide

## Current Status
- ✅ FFmpeg spawns successfully
- ✅ SDP file is created correctly
- ✅ PlainTransports are created
- ❌ No HLS files (.m3u8 or .ts) are generated
- ❌ FFmpeg exits with code 183

## Root Cause
FFmpeg exit code 183 means it's not receiving any RTP packets. The issue is in the RTP stream flow from Mediasoup to FFmpeg.

## Possible Issues

### 1. PlainTransport Not Connected
The PlainTransports might not be properly connected to send RTP packets to FFmpeg.

### 2. Consumers Not Created
The consumers that pull media from producers and send to PlainTransports might not be created correctly.

### 3. Codec Mismatch
The browser might be sending VP8 but SDP expects H264, or vice versa.

## Next Steps to Debug

1. **Check if ports are listening:**
```bash
netstat -an | grep -E ":(20000|20001|20002|20003)"
```

2. **Monitor RTP packets:**
```bash
sudo tcpdump -i lo port 20000 or port 20002 -c 20
```

3. **Check FFmpeg stderr for actual errors:**
Need to capture full FFmpeg stderr output to see what it's complaining about.

## Likely Fix
The issue is probably that consumers are being created AFTER FFmpeg times out, or the codec negotiation is failing. Need to ensure:
- Consumers are created immediately after PlainTransport connection
- Codec is H264 (not VP8)
- RTP packets are actually flowing
