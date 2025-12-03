import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Agent } from "@services/agentService";
import { Link as RouterLink } from "react-router-dom";

export type AgentStatus = "ACTIVE" | "STOPPED" | "FAILURE";

interface AgentCardProps {
  agent: Agent;
  defaultExpanded?: boolean;
}

const renderField = (label: string, value: any) => {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{String(value)}</Typography>
    </Stack>
  );
};

export const AgentCard = ({
  agent,
  defaultExpanded = false,
}: AgentCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // camera config
  const camera = agent.config.camera;

  const status: AgentStatus = camera.status as AgentStatus;

  const statusLabel =
    status === "ACTIVE"
      ? "Active"
      : status === "STOPPED"
      ? "Offline"
      : "Failure";

  const statusColor =
    status === "ACTIVE"
      ? "success"
      : status === "STOPPED"
      ? "default"
      : "warning";

  return (
    <Card variant="outlined">
      {/* ----------------------- HEADER ----------------------- */}
      <CardHeader
        title={
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            {/* Title + ID */}
            <Stack spacing={0.5}>
              <Typography variant="h6">
                <Link
                  component={RouterLink}
                  to={`/agents/${agent.id}`}
                  underline="hover"
                  onClick={(e) => e.stopPropagation()}
                >
                  {agent.name}
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PI ID: {agent.config.camera.pi_id}
              </Typography>
            </Stack>

            {/* Status + expand button */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={statusLabel} color={statusColor} />

              <IconButton
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-label={
                  expanded ? "Collapse agent details" : "Expand agent details"
                }
                size="small"
              >
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease-out",
                  }}
                />
              </IconButton>
            </Stack>
          </Stack>
        }
      />

      {/* ----------------------- ALWAYS-VISIBLE CONTENT ----------------------- */}
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 80 }}
            >
              Location:
            </Typography>
            <Typography variant="body2">{camera.location}</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 80 }}
            >
              Mode:
            </Typography>
            <Typography variant="body2">{camera.mode}</Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* ----------------------- COLLAPSIBLE CAMERA CONFIG ----------------------- */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0, pb: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Camera Configuration
            </Typography>

            {/* >>> FIXED 2 COLUMN GRID <<< */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {renderField("Framerate", camera.framerate)}
              {renderField("Bitrate", camera.bitrate)}
              {renderField("Resolution Width", camera.resolution.width)}
              {renderField("Resolution Height", camera.resolution.height)}

              {renderField(
                "Recording Time",
                `${camera.recording_time} ${camera.recording_time_unit}`
              )}
              {renderField(
                "Rest Time",
                `${camera.cycle_rest_time} ${camera.cycle_rest_time_unit}`
              )}

              {renderField(
                "Image Capture",
                `${camera.image_capture_time} ${camera.image_capture_time_unit}`
              )}
              {renderField(
                "Image Rest",
                `${camera.image_rest_time} ${camera.image_rest_time_unit}`
              )}

              {renderField(
                "Vertical Flip",
                camera.transforms.vertical_flip ? "Yes" : "No"
              )}
              {renderField(
                "Horizontal Flip",
                camera.transforms.horizontal_flip ? "Yes" : "No"
              )}

              {renderField("RTSP", camera.rtsp_stream?.address || "(none)")}

              {renderField("Output Dir", camera.output_dir)}
              {renderField("Pi ID", camera.pi_id)}
            </div>
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};
