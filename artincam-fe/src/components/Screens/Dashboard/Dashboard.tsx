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
} from "@mui/material";

import { agentService, type Agent } from "@services/agentService";
import AssetFileCumulativeChart from "./AssetFileCumulativeChart";
import HealthLogActivity from "./HealthLogActivity";
import HealthStatusChart from "./HealthStatusChart";

import { FilterProvider, useFilter } from "./contexts/FilterContext";

const LS_SELECTED_AGENT_KEY = "artincam:selectedAgentId";

function DashboardInner() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const {
    applied,
    draft,
    setAgentId,
    setDraftStart,
    setDraftEnd,
    apply,
    clearDraft,
  } = useFilter();

  const selectedAgentId = applied.agentId;

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
                onChange={(e) => {
                  const nextId = e.target.value as string;
                  setAgentId(nextId);
                }}
                displayEmpty
                renderValue={(value) => {
                  if (!value) {
                    return (
                      <span style={{ color: "#888" }}>Choose an agent</span>
                    );
                  }
                  const a = agents.find((ag) => ag.id === value);
                  return a ? a.name : value;
                }}
              >
                <MenuItem value="">
                  <em>None</em>
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
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <TextField
                label="Start date"
                type="date"
                size="small"
                value={
                  draft.start ? draft.start.toISOString().slice(0, 10) : ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftStart(v ? new Date(`${v}T00:00:00`) : null);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", sm: 220 } }}
              />

              <TextField
                label="End date"
                type="date"
                size="small"
                value={draft.end ? draft.end.toISOString().slice(0, 10) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftEnd(v ? new Date(`${v}T00:00:00`) : null);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", sm: 220 } }}
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

              <Stack justifyContent="center" sx={{ ml: { sm: "auto" } }}>
                <Typography variant="caption" color="text.secondary">
                  Applied:{" "}
                  {applied.start
                    ? applied.start.toISOString().slice(0, 10)
                    : "—"}{" "}
                  → {applied.end ? applied.end.toISOString().slice(0, 10) : "—"}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <HealthLogActivity agentId={selectedAgentId || null} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <HealthStatusChart agentId={selectedAgentId || null} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <AssetFileCumulativeChart agentId={selectedAgentId || null} />
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
