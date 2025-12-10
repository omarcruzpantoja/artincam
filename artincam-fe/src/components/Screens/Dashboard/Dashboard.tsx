import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { agentService, type Agent } from "@services/agentService";
import AssetFileCumulativeChart from "./AssetFileCumulativeChart";
import AssetFileDailyCountChart from "./AssetFileDailyCounterChart";
import HealthLogActivity from "./HealthLogActivity";
import HealthStatusChart from "./HealthStatusChart";

const STATUS_COLORS = ["#4caf50", "#ff9800", "#f44336"]; // active, idle, offline

const Dashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // ---- Load agents from API ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAgentsLoading(true);
        setAgentsError(null);

        // Adjust this to your real API method: getAllAgents / listAgents / etc.
        const res = await agentService.listAgents();
        // const res = await agentService.getAllAgents();

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

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const statusBreakdown = useMemo(
    () => [
      { name: "Active", value: selectedAgentId ? 65 : 50 },
      { name: "Idle", value: selectedAgentId ? 20 : 30 },
      { name: "Offline", value: selectedAgentId ? 15 : 20 },
    ],
    [selectedAgentId]
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
                onChange={(e) => setSelectedAgentId(e.target.value as string)}
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

      {/* If agent selected, show graphs */}
      {selectedAgent && (
        <Grid container spacing={2}>
          {/* Row 1 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <HealthLogActivity agentId={selectedAgentId || null} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <HealthStatusChart agentId={selectedAgentId || null} />
          </Grid>

          {/* Row 2 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <AssetFileCumulativeChart agentId={selectedAgentId || null} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <AssetFileDailyCountChart agentId={selectedAgentId || null} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
