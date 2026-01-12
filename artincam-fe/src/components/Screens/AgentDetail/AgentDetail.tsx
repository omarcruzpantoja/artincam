import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { getServerHost } from "@services/baseService";
import { agentService, type Agent } from "@services/agentService";

import AssetFileTable from "./AssetFileTable";
import AgentPreviewPanel from "./AgentPreviewPanel";
import CameraConfiguration from "./CameraConfiguration";
import AgentHeaderPanel from "./AgentHeaderPanel"; // your extracted component
import type { ActionItem } from "@components/Common/ActionsMenu";
import PageHeader from "@components/common/PageHeader";

type AgentAction = "edit" | "delete";

const statusMeta = (status: string) => {
  if (status === "ACTIVE")
    return { label: "Active", color: "success" as const };
  if (status === "STOPPED")
    return { label: "Offline", color: "default" as const };
  return { label: "Failure", color: "warning" as const };
};

const replaceLocalhost = (url: string) => {
  const host = getServerHost();
  return url.replace(/localhost/g, host);
};

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
  const mode = agent.config?.camera?.mode ?? "(unknown)";
  const meta = statusMeta(status);

  return (
    <>
      <PageHeader
        title=""
        breadcrumb={[
          { label: "Home", url: "/" },
          { label: "Agents", url: "/agents" },
          { label: agent.name, active: true },
        ]}
      />
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          py: 2.5,
          px: { xs: 2, md: 3 },
        }}
      >
        {/* Row 1: Preview + Details */}
        <Box sx={{ width: "100%" }}>
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, lg: 5 }}>
              <AgentPreviewPanel
                agentId={agent.id}
                mode={agent.config.camera.mode}
                status={agent.config.camera.status}
                rtspUrl={replaceLocalhost(
                  agent.config?.camera?.rtsp_stream?.address ?? ""
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <AgentHeaderPanel<AgentAction>
                agent={{
                  id: agent.id,
                  name: agent.name,
                  description: agent.description,
                }}
                modeText={mode}
                meta={meta}
                actionItems={actionItems}
                onAction={handleAgentAction}
                menuId={`agent-${agent.id}-actions-menu`}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Row 2: Configuration (full width) */}
        <Box sx={{ width: "100%" }}>
          <CameraConfiguration agent={agent} />
        </Box>

        {/* Row 3: Tables (full width) */}
        <Box sx={{ width: "100%" }}>
          <AssetFileTable agentId={agent.id} />
        </Box>
      </Box>
    </>
  );
};

export default AgentDetail;
