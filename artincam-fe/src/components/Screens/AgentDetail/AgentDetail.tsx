// src/components/Screens/AgentDetailScreen.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { agentService, type Agent } from "@services/agentService";
import ActionsMenu, { type ActionItem } from "@components/Common/ActionsMenu";

import AssetFileTable from "./AssetFileTable";
import CameraConfiguration from "./CameraConfiguration";
import { Row } from "./utils";

type AgentAction = "edit" | "restart" | "delete";

const AgentDetail = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      : "warning";

  const actionItems: ActionItem<AgentAction>[] = [
    { value: "edit", label: "Edit agent" },
    { value: "restart", label: "Restart agent" },
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
        // TODO: navigate to edit page / open dialog
        break;
      case "restart":
        console.log("Restart agent", agent.id);
        // TODO: call restart endpoint
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
              <Typography variant="h4">{agent.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  ID: {agent.id}
                </Typography>
                <Chip
                  size="small"
                  label={status}
                  color={statusColor}
                  sx={{ textTransform: "capitalize" }}
                />
                {location && (
                  <Typography variant="body2" color="text.secondary">
                    • {location}
                  </Typography>
                )}
              </Stack>
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
        <Grid container spacing={3}>
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
                Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.25}>
                <Row label="Status" value={status} />
                {location && <Row label="Location" value={location} />}

                {agent.description && (
                  <Row label="Description" value={agent.description} />
                )}

                {agent.created_at && (
                  <Row
                    label="Created"
                    value={new Date(agent.created_at).toLocaleString()}
                  />
                )}

                {agent.updated_at && (
                  <Row
                    label="Updated"
                    value={new Date(agent.updated_at).toLocaleString()}
                  />
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Placeholder for future sections */}
          {/* Camera config section */}
          <CameraConfiguration agent={agent} />
        </Grid>
      </Stack>
      <AssetFileTable agentId={agent.id} />
    </Container>
  );
};

export default AgentDetail;
