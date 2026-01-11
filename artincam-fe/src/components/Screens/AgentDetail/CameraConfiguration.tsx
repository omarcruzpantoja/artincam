import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Agent } from "@services/agentService";

interface CameraConfigurationProps {
  agent: Agent;
  defaultExpanded?: boolean;
}

function LaveValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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
  defaultExpanded = false,
}: CameraConfigurationProps): React.JSX.Element => {
  const camera = agent.config?.camera;

  const summaryLine = camera
    ? `${camera.mode ?? "(mode)"} • ${camera.status ?? "UNKNOWN"}`
    : "No configuration";

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Accordion
        disableGutters
        defaultExpanded={defaultExpanded}
        sx={{
          // Make accordion blend with Card (Aurora-ish)
          boxShadow: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 2.5,
            py: 1.5,
            "& .MuiAccordionSummary-content": {
              my: 0,
              minWidth: 0,
            },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
              Camera Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {summaryLine}
            </Typography>
          </Box>
        </AccordionSummary>

        <Divider />

        <AccordionDetails sx={{ px: 2.5, py: 2 }}>
          {camera ? (
            (() => {
              const resolutionLabel = `${camera.resolution.width} x ${camera.resolution.height}`;
              const framerateLabel =
                camera.framerate !== undefined
                  ? `${camera.framerate} fps`
                  : "-";
              const bitrateLabel =
                camera.bitrate !== undefined && camera.bitrate !== null
                  ? `${camera.bitrate} bps`
                  : "-";
              const recordingTimeLabel =
                camera.recording_time !== undefined
                  ? `${camera.recording_time} ${camera.recording_time_unit ?? "s"}`
                  : "-";
              const cycleRestTimeLabel =
                camera.cycle_rest_time !== undefined
                  ? `${camera.cycle_rest_time} ${camera.cycle_rest_time_unit ?? "s"}`
                  : "-";
              const imageCaptureTimeLabel =
                camera.image_capture_time !== undefined
                  ? `${camera.image_capture_time} ${camera.image_capture_time_unit ?? "s"}`
                  : "-";
              const imageRestTimeLabel =
                camera.image_rest_time !== undefined
                  ? `${camera.image_rest_time} ${camera.image_rest_time_unit ?? "s"}`
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
                    <LaveValue label="Mode" value={camera.mode} />
                    <LaveValue
                      label="Status"
                      value={camera.status ?? "UNKNOWN"}
                    />
                    <LaveValue label="Location" value={camera.location} />
                    <LaveValue label="Pi ID" value={String(camera.pi_id)} />
                    <LaveValue label="Output dir" value={camera.output_dir} />
                    <LaveValue
                      label="Agent dir"
                      value={agent.config.agent_dir}
                    />
                    <LaveValue label="Resolution" value={resolutionLabel} />
                    <LaveValue label="Framerate" value={framerateLabel} />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <LaveValue label="Bitrate" value={bitrateLabel} />
                    <LaveValue
                      label="Recording time"
                      value={recordingTimeLabel}
                    />
                    <LaveValue
                      label="Cycle rest time"
                      value={cycleRestTimeLabel}
                    />
                    <LaveValue
                      label="Image capture"
                      value={imageCaptureTimeLabel}
                    />
                    <LaveValue label="Image rest" value={imageRestTimeLabel} />
                    <LaveValue label="RTSP stream" value={rtspLabel} />
                    <LaveValue label="Transforms" value={transformsLabel} />
                  </Grid>
                </Grid>
              );
            })()
          ) : (
            <Typography variant="body2" color="text.secondary">
              No camera configuration available.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default CameraConfiguration;
