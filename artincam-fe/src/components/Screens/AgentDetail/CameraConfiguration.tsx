import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { Agent } from "@services/agentService";

interface CameraConfigurationProps {
  agent: Agent;
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "140px 1fr", md: "170px 1fr" },
        gap: 1.5,
        py: 0.85,
        alignItems: "baseline",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

const CameraConfiguration = ({
  agent,
}: CameraConfigurationProps): React.JSX.Element => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const panelBg = alpha(theme.palette.background.paper, isDark ? 0.42 : 0.78);
  const border = alpha(theme.palette.divider, isDark ? 0.25 : 0.65);

  const camera = agent.config?.camera;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${border}`,
        bgcolor: panelBg,
        overflow: "hidden",
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
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Camera Configuration
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, py: 2 }}>
        {camera ? (
          (() => {
            const resolutionLabel = `${camera.resolution.width} x ${camera.resolution.height}`;
            const framerateLabel =
              camera.framerate !== undefined ? `${camera.framerate} fps` : "-";
            const bitrateLabel =
              camera.bitrate !== undefined && camera.bitrate !== null
                ? `${camera.bitrate} bps`
                : "-";
            const recordingTimeLabel =
              camera.recording_time !== undefined
                ? `${camera.recording_time} ${
                    camera.recording_time_unit ?? "s"
                  }`
                : "-";
            const cycleRestTimeLabel =
              camera.cycle_rest_time !== undefined
                ? `${camera.cycle_rest_time} ${
                    camera.cycle_rest_time_unit ?? "s"
                  }`
                : "-";
            const imageCaptureTimeLabel =
              camera.image_capture_time !== undefined
                ? `${camera.image_capture_time} ${
                    camera.image_capture_time_unit ?? "s"
                  }`
                : "-";
            const imageRestTimeLabel =
              camera.image_rest_time !== undefined
                ? `${camera.image_rest_time} ${
                    camera.image_rest_time_unit ?? "s"
                  }`
                : "-";
            const rtspLabel = camera.rtsp_stream?.address ?? "-";
            const transformsLabel =
              [
                camera.transforms.vertical_flip ? "Vertical flip" : null,
                camera.transforms.horizontal_flip ? "Horizontal flip" : null,
              ]
                .filter(Boolean)
                .join(" • ") || "None";

            return (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <KV label="Mode" value={camera.mode} />
                  <KV label="Status" value={camera.status ?? "UNKNOWN"} />
                  <KV label="Location" value={camera.location} />
                  <KV label="Pi ID" value={String(camera.pi_id)} />
                  <KV label="Output dir" value={camera.output_dir} />
                  <KV label="Resolution" value={resolutionLabel} />
                  <KV label="Framerate" value={framerateLabel} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <KV label="Bitrate" value={bitrateLabel} />
                  <KV label="Recording time" value={recordingTimeLabel} />
                  <KV label="Cycle rest time" value={cycleRestTimeLabel} />
                  <KV label="Image capture" value={imageCaptureTimeLabel} />
                  <KV label="Image rest" value={imageRestTimeLabel} />
                  <KV label="RTSP stream" value={rtspLabel} />
                  <KV label="Transforms" value={transformsLabel} />
                </Grid>
              </Grid>
            );
          })()
        ) : (
          <Typography variant="body2" color="text.secondary">
            No camera configuration available.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default CameraConfiguration;
