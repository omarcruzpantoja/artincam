// RtspPlayer.tsx (really: HLS player for your RTSP source)
import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface RtspPlayerProps {
  rtspUrl: string; // the HLS URL that your RTSP is converted to
}

function rtspToHls(rtspUrl: string, hlsPort: number = 8888): string | null {
  try {
    const url = new URL(rtspUrl);

    if (url.protocol !== "rtsp:") {
      throw new Error("Invalid RTSP URL");
    }

    // Example: rtsp://192.168.0.98:8554/camstream
    const hostname = url.hostname; // 192.168.0.98
    const path = url.pathname.replace(/^\//, ""); // camstream

    return `http://${hostname}:${hlsPort}/${path}/index.m3u8`;
  } catch (err) {
    console.error("Failed to convert RTSP → HLS:", err);
    return null;
  }
}

const RtspPlayer = ({ rtspUrl }: RtspPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let hlsUrl: string | null = null;
    const video = videoRef.current;
    if (!video) return;

    // If the browser supports MediaSource, use hls.js
    if (Hls.isSupported()) {
      const hls = new Hls();
      const hlsUrl = rtspToHls(rtspUrl);
      if (!hlsUrl) return;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error", data);
      });

      return () => {
        hls.destroy();
      };
    }

    // Fallback: some browsers (iOS Safari) can play HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl") && hlsUrl) {
      video.src = hlsUrl;
    }
  }, [rtspUrl]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: "100%", maxHeight: 480, backgroundColor: "black" }}
    />
  );
};

export default RtspPlayer;
