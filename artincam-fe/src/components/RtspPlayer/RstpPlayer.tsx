import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface RtspPlayerProps {
  rtspUrl: string;
  isFullscreen?: boolean;
}

function rtspToHls(rtspUrl: string, hlsPort: number = 8888): string | null {
  try {
    const url = new URL(rtspUrl);
    if (url.protocol !== "rtsp:") throw new Error("Invalid RTSP URL");

    const hostname = url.hostname;
    const path = url.pathname.replace(/^\//, "");
    return `http://${hostname}:${hlsPort}/${path}/index.m3u8`;
  } catch (err) {
    console.error("Failed to convert RTSP → HLS:", err);
    return null;
  }
}

const RtspPlayer = ({ rtspUrl, isFullscreen = false }: RtspPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Init / teardown stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setLoading(true);

    const hlsUrl = rtspToHls(rtspUrl);
    if (!hlsUrl) {
      setError("Invalid RTSP stream URL.");
      setLoading(false);
      return;
    }

    // Clean any previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.src = "";

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 30 });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          setLoading(false);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setError("Network error while loading the video stream.");
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setError("Media decoding error.");
          } else {
            setError("Fatal streaming error.");
          }
          hls.destroy();
          hlsRef.current = null;
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;

      const onLoaded = () => {
        setLoading(false);
        video.play().catch(() => {});
      };
      const onErr = () => {
        setError("Failed to load video stream.");
        setLoading(false);
      };

      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onErr);

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onErr);
        video.src = "";
      };
    }

    setError("HLS playback not supported in this browser.");
    setLoading(false);
  }, [rtspUrl]);

  useEffect(() => {
    if (!isFullscreen) return;
    const video = videoRef.current;
    if (!video) return;

    const id = window.setTimeout(() => {
      video.play().catch(() => {});
    }, 50);

    return () => window.clearTimeout(id);
  }, [isFullscreen]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        controls
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: "black",
          objectFit: "contain", // ✅ keeps entire 4:3 frame visible
        }}
      />

      {loading && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Connecting to stream…
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            color: "#ffb4b4",
            padding: 16,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          🚨 {error}
        </div>
      )}
    </div>
  );
};

export default RtspPlayer;
