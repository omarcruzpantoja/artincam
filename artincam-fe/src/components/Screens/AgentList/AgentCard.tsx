import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { Agent } from "@services/agentService";
import { Link as RouterLink } from "react-router-dom";

export type AgentStatus = "ACTIVE" | "STOPPED" | "FAILURE";

interface AgentCardProps {
  agent: Agent;
  defaultExpanded?: boolean;
}

function statusMeta(status: AgentStatus) {
  if (status === "ACTIVE")
    return { label: "Active", color: "success" as const };
  if (status === "STOPPED")
    return { label: "Offline", color: "default" as const };
  return { label: "Failure", color: "warning" as const };
}

function kv(label: string, value: React.ReactNode) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 1.5,
        py: 0.75,
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

export const AgentCard = ({
  agent,
  defaultExpanded = false,
}: AgentCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [expanded, setExpanded] = useState(defaultExpanded);

  const camera = agent.config.camera;
  const status: AgentStatus = camera.status as AgentStatus;
  const meta = useMemo(() => statusMeta(status), [status]);

  const panelBg = alpha(theme.palette.background.paper, isDark ? 0.42 : 0.78);
  const border = alpha(theme.palette.divider, isDark ? 0.25 : 0.65);

  // small accent based on status
  const accent =
    status === "ACTIVE"
      ? theme.palette.success.main
      : status === "STOPPED"
      ? alpha(theme.palette.text.primary, 0.35)
      : theme.palette.warning.main;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        bgcolor: panelBg,
        borderColor: border,
        overflow: "hidden",
        boxShadow: "none",
        transition: "border-color 140ms ease, transform 140ms ease",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, isDark ? 0.35 : 0.25),
          transform: "translateY(-1px)",
        },
      }}
    >
      {/* Top meta bar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: `1px solid ${alpha(
            theme.palette.divider,
            isDark ? 0.22 : 0.6
          )}`,
          background: isDark
            ? `linear-gradient(90deg, ${alpha(
                accent,
                0.12
              )} 0%, transparent 45%)`
            : `linear-gradient(90deg, ${alpha(
                accent,
                0.1
              )} 0%, transparent 55%)`,
        }}
      >
        {/* status dot */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: 999,
            bgcolor: accent,
            boxShadow: isDark ? `0 0 14px ${alpha(accent, 0.35)}` : "none",
          }}
        />

        <Chip
          size="small"
          label={meta.label}
          color={meta.color}
          sx={{
            height: 24,
            "& .MuiChip-label": { fontWeight: 700 },
          }}
        />

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 1,
            borderColor: alpha(theme.palette.divider, isDark ? 0.25 : 0.55),
          }}
        />

        {/* Title */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, lineHeight: 1.1 }}
            noWrap
          >
            <Link
              component={RouterLink}
              to={`/agents/${agent.id}`}
              underline="hover"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: "inherit" }}
            >
              {agent.name}
            </Link>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
            noWrap
          >
            PI ID: {camera.pi_id}
          </Typography>
        </Box>

        {/* Expand */}
        <IconButton
          onClick={() => setExpanded((p) => !p)}
          size="small"
          aria-expanded={expanded}
          aria-label={
            expanded ? "Collapse agent details" : "Expand agent details"
          }
          sx={{
            borderRadius: 1.5,
            border: `1px solid ${alpha(
              theme.palette.divider,
              isDark ? 0.22 : 0.55
            )}`,
            bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
            "&:hover": {
              bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.06),
            },
          }}
        >
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      {/* Summary row (always visible) */}
      <CardContent sx={{ pt: 1.5, pb: 1.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
            >
              Location
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {camera.location || "(none)"}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
            >
              Mode
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {camera.mode || "(unknown)"}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Expanded details (console key/value list) */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider
          sx={{
            borderColor: alpha(theme.palette.divider, isDark ? 0.22 : 0.6),
          }}
        />
        <CardContent sx={{ pt: 1.5, pb: 2 }}>
          <Stack spacing={0.25}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 0.75, letterSpacing: 0.6, textTransform: "uppercase" }}
            >
              Camera Configuration
            </Typography>

            {kv("Framerate", camera.framerate)}
            {kv("Bitrate", camera.bitrate)}
            {kv(
              "Resolution",
              `${camera.resolution.width}×${camera.resolution.height}`
            )}
            {kv(
              "Recording Time",
              `${camera.recording_time} ${camera.recording_time_unit}`
            )}
            {kv(
              "Rest Time",
              `${camera.cycle_rest_time} ${camera.cycle_rest_time_unit}`
            )}
            {kv(
              "Image Capture",
              `${camera.image_capture_time} ${camera.image_capture_time_unit}`
            )}
            {kv(
              "Image Rest",
              `${camera.image_rest_time} ${camera.image_rest_time_unit}`
            )}
            {kv(
              "Vertical Flip",
              camera.transforms.vertical_flip ? "Yes" : "No"
            )}
            {kv(
              "Horizontal Flip",
              camera.transforms.horizontal_flip ? "Yes" : "No"
            )}
            {kv("RTSP", camera.rtsp_stream?.address || "(none)")}
            {kv("Output Dir", camera.output_dir)}
            {kv("Pi ID", camera.pi_id)}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};
