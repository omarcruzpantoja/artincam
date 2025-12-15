// src/components/Screens/AgentDetailScreen.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Tooltip,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import ActionsMenu, { type ActionItem } from "@components/Common/ActionsMenu";
import { RtspPlayer } from "@components/RtspPlayer";
import { agentService, type Agent } from "@services/agentService";

import AssetFileTable from "./AssetFileTable";
import CameraConfiguration from "./CameraConfiguration";
import { Row } from "./utils";

type AgentAction = "edit" | "delete";

const AgentDetail = () => {
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

        if (!cancelled) {
          setAgent(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load agent details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack alignItems="center">
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!agent) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Agent not found.</Typography>
      </Container>
    );
  }

  const status = agent.config?.camera?.status ?? "unknown";
  const location = agent.config?.camera?.location;

  const statusColor =
    status === "ACTIVE"
      ? "success"
      : status === "STOPPED"
      ? "default"
      : "error";

  const statusLabel =
    status === "ACTIVE"
      ? "Active"
      : status === "STOPPED"
      ? "Offline"
      : "Failure";

  const actionItems: ActionItem<AgentAction>[] = [
    { value: "edit", label: "Edit agent" },
    {
      value: "delete",
      label: "Delete agent",
      variant: "danger",
      dividerAbove: true,
    },
  ];

  const handleAgentAction = (action: AgentAction) => {
    switch (action) {
      case "edit":
        navigate(`/agents/${agent.id}/edit`);
        break;
      case "delete":
        console.log("Delete agent", agent.id);
        // TODO: open confirmation + delete
        break;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header bar */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            px: 3,
            py: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack spacing={0.5}>
              <Typography variant="h4">
                {agent.name}{" "}
                <Chip
                  size="medium"
                  label={statusLabel}
                  color={statusColor}
                  sx={{ textTransform: "capitalize" }}
                />
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    ID: {agent.id}
                  </Typography>

                  <Tooltip title={copied ? "Copied!" : "Copy ID"}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(agent.id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1000);
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
              </Stack>

              {agent.description && (
                <Row label="Description" value={agent.description} />
              )}
            </Stack>

            <ActionsMenu<AgentAction>
              items={actionItems}
              onAction={handleAgentAction}
              ariaLabel="Agent actions"
              menuId={`agent-${agent.id}-actions-menu`}
            />
          </Stack>
        </Paper>

        {/* Main content */}
        <CameraConfiguration agent={agent} />
        <AssetFileTable agentId={agent.id} />
        {agent.config.camera.mode == "rtsp_stream" && (
          <RtspPlayer
            rtspUrl={agent.config?.camera?.rtsp_stream?.address ?? ""}
          />
        )}
      </Stack>
    </Container>
  );
};

export default AgentDetail;
