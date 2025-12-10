import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { type ActionLog } from "@services/actionLogService";
import { ACTIVE_COLOR, fetchAllActionLogs, OFFLINE_COLOR } from "./utils";

interface HealthStatusBreakdownChartProps {
  agentId: string | null;
}

const BUCKET_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;
const BUCKETS_PER_DAY = MINUTES_PER_DAY / BUCKET_MINUTES; // 288

const STATUS_COLORS = {
  active: ACTIVE_COLOR,
  offline: OFFLINE_COLOR,
};

const HealthStatusBreakdownChart = ({
  agentId,
}: HealthStatusBreakdownChartProps) => {
  if (!agentId) {
    return (
      <Paper
        sx={{
          p: 3,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select an agent to view status breakdown.
        </Typography>
      </Paper>
    );
  }

  const {
    data: logs = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<ActionLog[], Error>({
    queryKey: ["dashboard", "action-logs", "health", agentId],
    queryFn: () => fetchAllActionLogs(agentId, "health"),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const breakdown = useMemo(() => {
    if (!logs.length) {
      return { activePct: 0, offlinePct: 100, totalBuckets: 0 };
    }

    const bucketMap = new Map<string, Set<number>>();

    for (const log of logs) {
      if (!log.created_at) continue;

      const t = new Date(log.created_at);
      if (Number.isNaN(t.getTime())) continue;

      const yyyy = t.getFullYear();
      const mm = String(t.getMonth() + 1).padStart(2, "0");
      const dd = String(t.getDate()).padStart(2, "0");
      const dayKey = `${yyyy}-${mm}-${dd}`;

      const minutesOfDay = t.getHours() * 60 + t.getMinutes();
      if (minutesOfDay < 0 || minutesOfDay >= MINUTES_PER_DAY) continue;

      const bucketIndex = Math.floor(minutesOfDay / BUCKET_MINUTES);

      if (!bucketMap.has(dayKey)) {
        bucketMap.set(dayKey, new Set());
      }
      bucketMap.get(dayKey)!.add(bucketIndex);
    }

    const dayCount = bucketMap.size;
    if (dayCount === 0) {
      return { activePct: 0, offlinePct: 100, totalBuckets: 0 };
    }

    let active = 0;
    for (const buckets of bucketMap.values()) {
      active += buckets.size;
    }

    const total = dayCount * BUCKETS_PER_DAY;
    const activePct = (active / total) * 100;
    const offlinePct = 100 - activePct;

    return {
      activePct: Number(activePct.toFixed(1)),
      offlinePct: Number(offlinePct.toFixed(1)),
      totalBuckets: total,
    };
  }, [logs]);

  const loading = isLoading || isFetching;

  const data =
    breakdown.totalBuckets === 0
      ? []
      : [
          { name: "Active", value: breakdown.activePct },
          { name: "Offline", value: breakdown.offlinePct },
        ];

  return (
    <Paper
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          mb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">Status Breakdown</Typography>
      </Box>

      {loading && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && isError && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Alert severity="error">
            {error?.message ?? "Failed to load action logs."}
          </Alert>
        </Box>
      )}

      {!loading && !isError && breakdown.totalBuckets === 0 && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No health action logs available to compute status.
          </Typography>
        </Box>
      )}

      {!loading && !isError && breakdown.totalBuckets > 0 && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                <Cell key="active" fill={STATUS_COLORS.active} />
                <Cell key="offline" fill={STATUS_COLORS.offline} />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default HealthStatusBreakdownChart;
