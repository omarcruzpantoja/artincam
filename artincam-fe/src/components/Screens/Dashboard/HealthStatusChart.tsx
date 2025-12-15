import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { type ActionLog } from "@services/actionLogService";
import { ACTIVE_COLOR, fetchAllActionLogs, OFFLINE_COLOR } from "./utils";
import { useFilter } from "./contexts/FilterContext";

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate()
  )}`;
}

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

function addUTCDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

const HealthStatusBreakdownChart = ({
  agentId,
}: HealthStatusBreakdownChartProps) => {
  const { applied } = useFilter();

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
    queryKey: [
      "dashboard",
      "action-logs",
      "health",
      agentId,
      applied.start,
      applied.end,
    ],
    queryFn: () =>
      fetchAllActionLogs(agentId, "health", {
        startDate: applied.start?.toISOString(),
        endDate: applied.end?.toISOString(),
      }),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const breakdown = useMemo(() => {
    // ✅ Build bucket presence per day (UTC day + UTC minutes)
    const bucketMap = new Map<string, Set<number>>();

    for (const log of logs) {
      if (!log.created_at) continue;

      const t = new Date(log.created_at);
      if (Number.isNaN(t.getTime())) continue;

      const dayKey = ymdUTC(t);

      const minutesOfDay = t.getUTCHours() * 60 + t.getUTCMinutes();
      if (minutesOfDay < 0 || minutesOfDay >= MINUTES_PER_DAY) continue;

      const bucketIndex = Math.floor(minutesOfDay / BUCKET_MINUTES);
      if (bucketIndex < 0 || bucketIndex >= BUCKETS_PER_DAY) continue;

      if (!bucketMap.has(dayKey)) bucketMap.set(dayKey, new Set());
      bucketMap.get(dayKey)!.add(bucketIndex);
    }

    // ✅ Determine how many days we should count in the denominator
    // If the user applied a range: count EVERY day in that range.
    // Otherwise: count only observed days.
    let dayCount = 0;

    if (applied.start && applied.end) {
      const start = startOfUTCDay(applied.start);
      const end = startOfUTCDay(applied.end);

      if (end.getTime() >= start.getTime()) {
        for (
          let cur = new Date(start);
          cur.getTime() <= end.getTime();
          cur = addUTCDays(cur, 1)
        ) {
          dayCount += 1;
          const dayKey = ymdUTC(cur);
          // ensure "empty days" exist as offline days
          if (!bucketMap.has(dayKey)) bucketMap.set(dayKey, new Set());
        }
      } else {
        // weird range, fallback to observed
        dayCount = bucketMap.size;
      }
    } else {
      dayCount = bucketMap.size;
    }

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
  }, [logs, applied.start, applied.end]);

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
