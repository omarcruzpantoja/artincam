import React from "react";
import { Divider, Grid, Paper, Typography } from "@mui/material";

import { Row } from "./utils";
import type { Agent } from "@services/agentService";

interface CameraConfigurationProps {
  agent: Agent;
}

const CameraConfiguration = ({
  agent,
}: CameraConfigurationProps): React.JSX.Element => {
  return (
    <Grid>
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Typography variant="h6" gutterBottom>
          Camera Configuration
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {agent.config?.camera ? (
          <>
            {(() => {
              const camera = agent.config.camera;

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
                <Grid container>
                  {/* LEFT COLUMN */}
                  <Grid flex={1}>
                    <Row label="Mode" value={camera.mode} />
                    <Row label="Status" value={camera.status ?? "UNKNOWN"} />
                    <Row label="Location" value={camera.location} />
                    <Row label="Pi ID" value={String(camera.pi_id)} />
                    <Row label="Output dir" value={camera.output_dir} />
                    <Row label="Resolution" value={resolutionLabel} />
                    <Row label="Framerate" value={framerateLabel} />
                  </Grid>

                  {/* RIGHT COLUMN */}
                  <Grid flex={1}>
                    <Row label="Bitrate" value={bitrateLabel} />
                    <Row label="Recording time" value={recordingTimeLabel} />
                    <Row label="Cycle rest time" value={cycleRestTimeLabel} />
                    <Row label="Image capture" value={imageCaptureTimeLabel} />
                    <Row label="Image rest" value={imageRestTimeLabel} />
                    <Row label="RTSP stream" value={rtspLabel} />
                    <Row label="Transforms" value={transformsLabel} />
                  </Grid>
                </Grid>
              );
            })()}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No camera configuration available.
          </Typography>
        )}
      </Paper>
    </Grid>
  );
};

export default CameraConfiguration;
