import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Alert,
  Box,
  Button,
  Dialog,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { RtspPlayer } from "@components/RtspPlayer";

type PreviewTab = "image" | "rtsp";

type Props = {
  mode: string;
  rtspUrl?: string;
  dummyImageUrl?: string;
  status?: string; // must be "active" to load RTSP
};

const DEFAULT_DUMMY = "https://picsum.photos/seed/artincam/1200/700";
const IMAGE_HEIGHT = 420;

const PreviewFrame = ({
  children,
  onFullscreen,
  canFullscreen,
}: {
  children: React.ReactNode;
  onFullscreen: () => void;
  canFullscreen: boolean;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        height: IMAGE_HEIGHT,
        borderRadius: 2,
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
            onFullscreen();
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
          aria-label="Fullscreen"
        >
          <FullscreenIcon fontSize="inherit" />
        </IconButton>
      )}
      {children}
    </Box>
  );
};

const AgentPreviewPanel = ({
  mode,
  rtspUrl,
  dummyImageUrl = DEFAULT_DUMMY,
  status,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [tab, setTab] = useState<PreviewTab>("image");
  const [armed, setArmed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // NEW: show message ONLY when user attempts RTSP
  const [rtspBlockedMsg, setRtspBlockedMsg] = useState<string | null>(null);

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

  // Hard reset when RTSP becomes disallowed
  useEffect(() => {
    if (!canRtsp) {
      setArmed(false);
      setTab("image");
      setFullscreen(false);
    }
  }, [canRtsp]);

  // One computed state drives rendering
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
    setTab(next);
    setArmed(false);
  };

  const Content = ({ fullscreenMode }: { fullscreenMode: boolean }) => {
    if (tab === "image") {
      return (
        <PreviewFrame canFullscreen onFullscreen={() => setFullscreen(true)}>
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
              cursor: canRtsp ? "pointer" : "not-allowed",
              outline: "none",
              position: "relative",
            }}
          >
            <Box
              component="img"
              src={dummyImageUrl}
              alt="Agent preview"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        </PreviewFrame>
      );
    }

    // RTSP tab
    const frame = (node: React.ReactNode, canFullscreenBtn = true) => (
      <PreviewFrame
        canFullscreen={canFullscreenBtn}
        onFullscreen={() => setFullscreen(true)}
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
            <RtspPlayer rtspUrl={rtspUrl!} />
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
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(
            theme.palette.divider,
            isDark ? 0.25 : 0.65
          )}`,
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.42 : 0.78),
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${alpha(
              theme.palette.divider,
              isDark ? 0.22 : 0.6
            )}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Preview
          </Typography>

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
            }}
          >
            <Tab
              value="image"
              icon={<ImageIcon fontSize="small" />}
              iconPosition="start"
              label="Image"
            />
            {/* IMPORTANT: not disabled so we can show attempt feedback */}
            <Tab
              value="rtsp"
              icon={<VideocamIcon fontSize="small" />}
              iconPosition="start"
              label="RTSP Preview"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2.5, flex: 1, minHeight: 0 }}>
          <Content fullscreenMode={false} />
        </Box>
      </Paper>

      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}>
        <Box
          sx={{
            height: "100%",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${alpha(
                theme.palette.divider,
                isDark ? 0.22 : 0.6
              )}`,
            }}
          >
            <Typography sx={{ fontWeight: 900 }}>
              {tab === "image" ? "Image Preview" : "RTSP Preview"}
            </Typography>
            <IconButton
              onClick={() => setFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 2, flex: 1, minHeight: 0 }}>
            <Content fullscreenMode />
          </Box>
        </Box>
      </Dialog>

      {/* Feedback ONLY when user attempts RTSP while blocked */}
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
