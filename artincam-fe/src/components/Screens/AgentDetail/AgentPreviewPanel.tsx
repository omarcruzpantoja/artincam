import { useEffect, useMemo, useRef, useState } from "react";
import {
  alpha,
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Card,
  CardHeader,
  Divider,
  CardContent,
} from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { RtspPlayer } from "@components/RtspPlayer";
import { assetFileService } from "@services/assetFileService";

type PreviewTab = "image" | "rtsp";

type Props = {
  agentId: string;
  mode: string;
  rtspUrl?: string;
  status?: string; // must be "active" to load RTSP

  pollMs?: number;
};

const DEFAULT_POLL_MS = 5000;

// Locked size in normal mode (prevents layout jumping)
const WELL_HEIGHT = 420;

const PreviewFrame = ({
  children,
  onToggleFullscreen,
  canFullscreen,
  fullscreenMode,
}: {
  children: React.ReactNode;
  onToggleFullscreen: () => void;
  canFullscreen: boolean;
  fullscreenMode: boolean;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        borderRadius: 2,
        width: "100%",
        height: fullscreenMode ? "100%" : WELL_HEIGHT,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha(
          theme.palette.divider,
          isDark ? 0.22 : 0.55
        )}`,
        bgcolor: alpha(theme.palette.background.default, isDark ? 0.22 : 0.35),
      }}
    >
      {canFullscreen && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 5,
            borderRadius: 1.5,
            border: `1px solid ${alpha("#fff", 0.14)}`,
            bgcolor: alpha("#000", isDark ? 0.5 : 0.35),
            color: "#fff",
            backdropFilter: "blur(8px)",
            "&:hover": { bgcolor: alpha("#000", isDark ? 0.65 : 0.5) },
          }}
          aria-label={fullscreenMode ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreenMode ? (
            <FullscreenExitIcon fontSize="inherit" />
          ) : (
            <FullscreenIcon fontSize="inherit" />
          )}
        </IconButton>
      )}

      {children}
    </Box>
  );
};

const AgentPreviewPanel = ({
  agentId,
  mode,
  rtspUrl,
  status,
  pollMs = DEFAULT_POLL_MS,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [tab, setTab] = useState<PreviewTab>("image");
  const [armed, setArmed] = useState(false);

  // Real fullscreen state (Fullscreen API)
  const fsRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Show message ONLY when user attempts RTSP while blocked
  const [rtspBlockedMsg, setRtspBlockedMsg] = useState<string | null>(null);

  // ---- Latest image state (polled + cached) ----
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // Cache by asset file id (simple)
  const cachedAssetIdRef = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const modeSupportsRtsp = mode === "rtsp_stream";
  const isActive = (status ?? "").toLowerCase() === "active";
  const canRtsp = modeSupportsRtsp && isActive;
  const hasUrl = !!rtspUrl;

  const rtspDisabledReason = useMemo(() => {
    if (!modeSupportsRtsp) return "RTSP preview is not available in this mode.";
    if (!isActive)
      return `RTSP preview unavailable while status is "${
        status ?? "unknown"
      }".`;
    return "";
  }, [modeSupportsRtsp, isActive, status]);

  // Keep state in sync with browser fullscreen (Esc will trigger this)
  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterFullscreen = async () => {
    const el = fsRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch (e) {
      console.warn("requestFullscreen failed", e);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {
      console.warn("exitFullscreen failed", e);
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void exitFullscreen();
    else void enterFullscreen();
  };

  // Hard reset when RTSP becomes disallowed
  useEffect(() => {
    if (!canRtsp) {
      setArmed(false);
      setTab("image");
      if (document.fullscreenElement) void exitFullscreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRtsp]);

  // If user switches away from RTSP tab, stop player
  useEffect(() => {
    if (tab !== "rtsp") setArmed(false);
  }, [tab]);

  // ---- Poll latest image (only while on image tab) ----
  useEffect(() => {
    if (!agentId) return;

    let cancelled = false;
    let timer: number | null = null;

    const cleanupBlobUrl = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    const fetchLatest = async () => {
      // Only poll while viewing image tab (prevents unnecessary work)
      if (tab !== "image") return;

      try {
        setImgError(null);

        const res = await assetFileService.listByAgent({
          agentId,
          limit: 1,
          offset: 0,
          sortField: "timestamp",
          sortOrder: "desc",
        });

        if (cancelled) return;

        const latest = res.data?.[0] ?? null;

        if (!latest) {
          // no images yet
          cachedAssetIdRef.current = null;
          cleanupBlobUrl();
          setImgUrl(null);
          return;
        }

        // same id as cache => no change
        if (cachedAssetIdRef.current === latest.id) return;

        // new image => fetch bytes
        setImgLoading(true);

        const blob = await assetFileService.getContentBlob(latest.id);
        if (cancelled) return;

        // Replace blob URL
        cleanupBlobUrl();
        const nextUrl = URL.createObjectURL(blob);

        blobUrlRef.current = nextUrl;
        cachedAssetIdRef.current = latest.id;
        setImgUrl(nextUrl);
      } catch (e) {
        if (cancelled) return;
        setImgError(e instanceof Error ? e.message : "Failed to load preview.");
        // keep last cached image if any
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    };

    fetchLatest();
    timer = window.setInterval(() => void fetchLatest(), pollMs);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      cleanupBlobUrl();
    };
  }, [agentId, pollMs, tab]);

  // One computed state drives RTSP rendering
  const rtspState = useMemo(() => {
    if (!canRtsp) return "blocked" as const;
    if (!hasUrl) return "missing_url" as const;
    if (!armed) return "ready_disarmed" as const;
    return "playing" as const;
  }, [canRtsp, hasUrl, armed]);

  const attemptEnterRtsp = () => {
    if (!canRtsp) {
      setRtspBlockedMsg(rtspDisabledReason || "RTSP preview is unavailable.");
      return;
    }
    setTab("rtsp");
  };

  const setTabSafe = (next: PreviewTab) => {
    if (next === "rtsp") {
      attemptEnterRtsp();
      return;
    }
    cachedAssetIdRef.current = null; // reset image cache when returning to image tab
    setTab(next);
  };

  const Content = ({ fullscreenMode }: { fullscreenMode: boolean }) => {
    const imageFit = fullscreenMode ? "contain" : "cover";

    if (tab === "image") {
      return (
        <PreviewFrame
          canFullscreen
          fullscreenMode={fullscreenMode}
          onToggleFullscreen={toggleFullscreen}
        >
          <Box
            role="button"
            tabIndex={0}
            onClick={attemptEnterRtsp}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") attemptEnterRtsp();
            }}
            sx={{
              width: "100%",
              height: "100%",
              cursor: canRtsp ? "pointer" : "default",
              outline: "none",
              position: "relative",
            }}
          >
            {/* Image */}
            {imgUrl ? (
              <Box
                component="img"
                src={imgUrl}
                alt="Latest agent capture"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: imageFit,
                  display: "block",
                  bgcolor: "black",
                }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ width: "100%", height: "100%", p: 2 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  {imgError
                    ? "Preview unavailable."
                    : imgLoading
                      ? "Loading latest image..."
                      : "No images available yet."}
                </Typography>
              </Stack>
            )}

            {/* Top-left updating chip */}
            {imgLoading && (
              <Box
                sx={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  px: 1,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: alpha("#000", isDark ? 0.55 : 0.45),
                  color: "#fff",
                  border: `1px solid ${alpha("#fff", 0.12)}`,
                  backdropFilter: "blur(8px)",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  Updating…
                </Typography>
              </Box>
            )}
          </Box>
        </PreviewFrame>
      );
    }

    // RTSP tab
    const frame = (node: React.ReactNode, canFullscreenBtn = true) => (
      <PreviewFrame
        canFullscreen={canFullscreenBtn}
        fullscreenMode={fullscreenMode}
        onToggleFullscreen={toggleFullscreen}
      >
        {node}
      </PreviewFrame>
    );

    if (rtspState === "blocked") {
      return frame(
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: "100%", p: 2 }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            {rtspDisabledReason || "RTSP preview is unavailable."}
          </Typography>
        </Stack>,
        false
      );
    }

    if (rtspState === "missing_url") {
      return frame(
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ height: "100%", p: 2 }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            RTSP URL is not configured for this agent.
          </Typography>
        </Stack>,
        false
      );
    }

    if (rtspState === "ready_disarmed") {
      return frame(
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.25}
          sx={{ height: "100%", p: 2 }}
        >
          <Typography
            variant={fullscreenMode ? "h6" : "subtitle1"}
            sx={{ fontWeight: 900 }}
          >
            RTSP Preview Ready
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Press play to start streaming.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => setArmed(true)}
          >
            Play
          </Button>
        </Stack>
      );
    }

    // playing (ONLY mount player here)
    return (
      <Stack spacing={fullscreenMode ? 0 : 2}>
        {frame(
          <Box sx={{ width: "100%", height: "100%" }}>
            <RtspPlayer rtspUrl={rtspUrl!} isFullscreen={isFullscreen} />
          </Box>
        )}

        {!fullscreenMode && (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => setArmed(false)}
              sx={{
                borderColor: alpha(theme.palette.divider, isDark ? 0.35 : 0.55),
              }}
            >
              Stop
            </Button>
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardHeader
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Preview
            </Typography>
          }
          action={
            <Tabs
              value={tab}
              onChange={(_, v) => setTabSafe(v)}
              sx={{
                minHeight: 0,
                "& .MuiTab-root": {
                  minHeight: 0,
                  py: 0.75,
                  px: 1.25,
                  fontWeight: 800,
                  textTransform: "none",
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                },
              }}
            >
              <Tab
                value="image"
                icon={<ImageIcon fontSize="small" />}
                iconPosition="start"
                label="Image"
              />
              <Tab
                value="rtsp"
                icon={<VideocamIcon fontSize="small" />}
                iconPosition="start"
                label="RTSP"
              />
            </Tabs>
          }
          sx={{
            px: 2.5,
            py: 1.5,
            "& .MuiCardHeader-action": { alignSelf: "center", m: 0 },
            "& .MuiCardHeader-content": { minWidth: 0 },
          }}
        />

        <Divider />

        {/* Content */}
        <CardContent
          sx={{
            p: 2.5,
            pt: 2.25,
            flex: 1,
            minHeight: 0,
            display: "flex",
          }}
        >
          {/* Fullscreen wrapper (Fullscreen API root) */}
          <Box
            ref={fsRef}
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              ...(isFullscreen
                ? {
                    width: "100vw",
                    height: "100vh",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                  }
                : {
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }),
            }}
          >
            <Content fullscreenMode={isFullscreen} />
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!rtspBlockedMsg}
        autoHideDuration={4000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setRtspBlockedMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          variant="outlined"
          onClose={() => setRtspBlockedMsg(null)}
          sx={{
            bgcolor: alpha(theme.palette.background.paper, isDark ? 0.7 : 0.95),
            borderColor: alpha(theme.palette.warning.main, 0.4),
            backdropFilter: "blur(10px)",
          }}
        >
          {rtspBlockedMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AgentPreviewPanel;
