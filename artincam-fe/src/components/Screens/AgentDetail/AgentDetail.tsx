// src/components/Screens/AgentDetailScreen.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Tooltip,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import ActionsMenu, { type ActionItem } from "@components/Common/ActionsMenu";
import { RtspPlayer } from "@components/RtspPlayer";
import { getServerHost } from "@services/baseService";
import { agentService, type Agent } from "@services/agentService";

import AssetFileTable from "./AssetFileTable";
import CameraConfiguration from "./CameraConfiguration";

type AgentAction = "edit" | "delete";

function statusMeta(status: string) {
  if (status === "ACTIVE")
    return { label: "Active", color: "success" as const };
  if (status === "STOPPED")
    return { label: "Offline", color: "default" as const };
  return { label: "Failure", color: "warning" as const };
}

function replaceLocalhost(url: string) {
  const host = getServerHost();
  return url.replace(/localhost/g, host);
}

const AgentDetail = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { agentId } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await agentService.getAgent(agentId);

        if (!cancelled) setAgent(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load agent details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const actionItems: ActionItem<AgentAction>[] = useMemo(
    () => [
      { value: "edit", label: "Edit agent" },
      {
        value: "delete",
        label: "Delete agent",
        variant: "danger",
        dividerAbove: true,
      },
    ],
    []
  );

  const handleAgentAction = (action: AgentAction) => {
    switch (action) {
      case "edit":
        navigate(`/agents/${agentId}/edit`);
        break;
      case "delete":
        console.log("Delete agent", agentId);
        break;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!agent) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Agent not found.</Typography>
      </Container>
    );
  }

  const status = agent.config?.camera?.status ?? "unknown";
  const location = agent.config?.camera?.location ?? "(none)";
  const mode = agent.config?.camera?.mode ?? "(unknown)";

  const meta = statusMeta(status);

  const accent =
    status === "ACTIVE"
      ? theme.palette.success.main
      : status === "STOPPED"
      ? alpha(theme.palette.text.primary, 0.35)
      : theme.palette.warning.main;

  const panelBg = alpha(theme.palette.background.paper, isDark ? 0.42 : 0.78);
  const border = alpha(theme.palette.divider, isDark ? 0.25 : 0.65);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* --- Console Header Panel --- */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${border}`,
          bgcolor: panelBg,
          overflow: "hidden",
        }}
      >
        {/* Top meta bar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
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
                )} 0%, transparent 55%)`
              : `linear-gradient(90deg, ${alpha(
                  accent,
                  0.1
                )} 0%, transparent 65%)`,
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: 999,
              bgcolor: accent,
              boxShadow: isDark ? `0 0 14px ${alpha(accent, 0.3)}` : "none",
            }}
          />

          <Chip
            size="small"
            label={meta.label}
            color={meta.color}
            sx={{ height: 24, "& .MuiChip-label": { fontWeight: 800 } }}
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 1,
              borderColor: alpha(theme.palette.divider, isDark ? 0.25 : 0.55),
            }}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 900, lineHeight: 1.1 }}
              noWrap
            >
              {agent.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {location} • {mode}
            </Typography>
          </Box>

          <ActionsMenu<AgentAction>
            items={actionItems}
            onAction={handleAgentAction}
            ariaLabel="Agent actions"
            menuId={`agent-${agent.id}-actions-menu`}
          />
        </Box>

        {/* Header body */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.25}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
              >
                Agent ID
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {agent.id}
              </Typography>

              <Tooltip title={copied ? "Copied!" : "Copy ID"}>
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(agent.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1000);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(
                      theme.palette.divider,
                      isDark ? 0.22 : 0.55
                    )}`,
                    bgcolor: alpha(
                      theme.palette.text.primary,
                      isDark ? 0.06 : 0.04
                    ),
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.text.primary,
                        isDark ? 0.1 : 0.06
                      ),
                    },
                  }}
                >
                  {copied ? (
                    <CheckIcon fontSize="inherit" color="success" />
                  ) : (
                    <ContentCopyIcon fontSize="inherit" />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>

            {agent.description ? (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ letterSpacing: 0.4, textTransform: "uppercase" }}
                >
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {agent.description}
                </Typography>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Paper>

      {/* Main panels */}
      <CameraConfiguration agent={agent} />
      <AssetFileTable agentId={agent.id} />

      {agent.config.camera.mode === "rtsp_stream" && (
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
              Live Stream
            </Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <RtspPlayer
              rtspUrl={replaceLocalhost(
                agent.config?.camera?.rtsp_stream?.address ?? ""
              )}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AgentDetail;
