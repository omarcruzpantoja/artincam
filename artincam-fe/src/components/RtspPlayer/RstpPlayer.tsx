import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface RtspPlayerProps {
  rtspUrl: string; // RTSP URL converted to HLS
}

function rtspToHls(rtspUrl: string, hlsPort: number = 8888): string | null {
  try {
    const url = new URL(rtspUrl);

    if (url.protocol !== "rtsp:") {
      throw new Error("Invalid RTSP URL");
    }

    // Example: rtsp://192.168.0.98:8554/camstream
    const hostname = url.hostname;
    const path = url.pathname.replace(/^\//, "");

    return `http://${hostname}:${hlsPort}/${path}/index.m3u8`;
  } catch (err) {
    console.error("Failed to convert RTSP → HLS:", err);
    return null;
  }
}

const RtspPlayer = ({ rtspUrl }: RtspPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    // ---- HLS.JS PATH ----
    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {
          /* autoplay may fail silently */
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error while loading the video stream.");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media decoding error.");
              break;
            default:
              setError("Fatal streaming error.");
          }
          setLoading(false);
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // ---- NATIVE HLS (Safari) ----
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError("Failed to load video stream.");
        setLoading(false);
      });
    }

    return () => {
      video.src = "";
    };
  }, [rtspUrl]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Video */}
      <video
        ref={videoRef}
        controls
        muted
        style={{
          width: "100%",
          maxHeight: 480,
          backgroundColor: "black",
        }}
      />

      {/* Loading overlay */}
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

      {/* Error overlay */}
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
