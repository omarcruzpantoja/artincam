import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  TextField,
  Card,
} from "@mui/material";

import { agentService, type Agent } from "@services/agentService";
import HealthLogActivity from "./HealthLogActivity";
import HealthStatusChart from "./HealthStatusChart";

import { FilterProvider, useFilter } from "./contexts/FilterContext";
import AssetFileImagesPerDay from "./AssetFileImagesPerDay";

const LS_SELECTED_AGENT_KEY = "artincam:selectedAgentId";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdFromUTCDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate()
  )}`;
}

function DashboardInner() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const {
    applied,
    draft,
    setAgentId,
    setDraftStartDate,
    setDraftEndDate,
    apply,
    clearDraft,
  } = useFilter();

  const selectedAgentId = applied.agentId;

  // ✅ UTC-safe values for <input type="date">
  const startValue = draft.start ? ymdFromUTCDate(draft.start) : "";
  const endValue = draft.end ? ymdFromUTCDate(draft.end) : "";

  // ---- Load agents from API ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAgentsLoading(true);
        setAgentsError(null);

        const res = await agentService.listAgents();

        if (cancelled) return;
        setAgents(res.data);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Failed to load agents.";
        setAgentsError(message);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Restore last selected agent from localStorage (only once) ----
  useEffect(() => {
    const saved = localStorage.getItem(LS_SELECTED_AGENT_KEY);
    if (saved) {
      setAgentId(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Persist selected agent to localStorage ----
  useEffect(() => {
    if (selectedAgentId) {
      localStorage.setItem(LS_SELECTED_AGENT_KEY, selectedAgentId);
    }
  }, [selectedAgentId]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Header row */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h5" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of agent activity, images, and status.
          </Typography>
        </Grid>

        {/* Agent select top-right */}
        <Grid>
          {agentsLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading agents...
              </Typography>
            </Stack>
          ) : agentsError ? (
            <Alert severity="error">{agentsError}</Alert>
          ) : (
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="agent-select-label">Agent</InputLabel>
              <Select
                labelId="agent-select-label"
                label="Agent"
                value={selectedAgentId}
                onChange={(e) => setAgentId(e.target.value as string)}
              >
                {/* ✅ Proper placeholder without overlap */}
                <MenuItem value="" disabled>
                  <em>Choose an agent</em>
                </MenuItem>

                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Grid>
      </Grid>

      {/* If no agent selected */}
      {!selectedAgent && !agentsLoading && !agentsError && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6">No agent selected</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an agent from the dropdown on the top-right to view metrics.
          </Typography>
        </Paper>
      )}

      {/* If agent selected, show filter controls + charts */}
      {selectedAgent && (
        <>
          <Card sx={{ p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <TextField
                label="Start date (UTC)"
                type="date"
                value={startValue}
                onChange={(e) => setDraftStartDate(e.target.value || null)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="End date (UTC)"
                type="date"
                value={endValue}
                onChange={(e) => setDraftEndDate(e.target.value || null)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={apply}
                  disabled={!selectedAgentId}
                >
                  Apply
                </Button>

                <Button
                  variant="outlined"
                  onClick={clearDraft}
                  disabled={!draft.start && !draft.end}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Card>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <HealthLogActivity agentId={selectedAgentId || null} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <HealthStatusChart agentId={selectedAgentId || null} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <AssetFileImagesPerDay agentId={selectedAgentId || null} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

const Dashboard = () => {
  return (
    <FilterProvider>
      <DashboardInner />
    </FilterProvider>
  );
};

export default Dashboard;
