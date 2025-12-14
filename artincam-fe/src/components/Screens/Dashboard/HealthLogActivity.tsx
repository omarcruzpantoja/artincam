import { useMemo, type FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import {
  CartesianGrid,
  Dot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  type DotProps,
} from "recharts";
import { type ActionLog } from "@services/actionLogService";
import { ACTIVE_COLOR, fetchAllActionLogs } from "./utils";

interface ActionLogHealthDotsMatrixChartProps {
  agentId: string | null;
}

// One dot per (day, 5-min bucket) that has >=1 logs
interface HealthDotPoint {
  dayLabel: string; // "2025-12-08"
  dayIndex: number;
  minutesOfDay: number; // 0..1440 (minute index, e.g. 75 = 01:15)
  timeLabel: string; // "HH:MM" for tooltip
  count: number; // number of logs in that bucket
}

const BUCKET_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;
const BUCKETS_PER_DAY = MINUTES_PER_DAY / BUCKET_MINUTES; // 288

// Format minutes since midnight into "HH:MM"
const formatMinutesToTime = (minutes: number): string => {
  const m = Math.floor(minutes);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const HealthLogActivity = ({
  agentId,
}: ActionLogHealthDotsMatrixChartProps) => {
  // If no agent selected, show placeholder
  if (!agentId) {
    return (
      <Paper
        sx={{
          p: 3,
          height: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select an agent to view health logs.
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

  // Build dot matrix: X = day, Y = time-of-day bucket
  const points: HealthDotPoint[] = useMemo(() => {
    if (!logs.length) return [];

    logs.reverse();

    // Map of date -> bucketIndex -> count
    const bucketMap = new Map<string, Map<number, number>>();
    const dateIndexMap = new Map<string, number>();

    for (const log of logs) {
      if (!log.created_at) continue;

      const t = new Date(log.created_at);
      if (Number.isNaN(t.getTime())) continue;

      // Local date key like "2025-12-08"
      const yyyy = t.getFullYear();
      const mm = String(t.getMonth() + 1).padStart(2, "0");
      const dd = String(t.getDate()).padStart(2, "0");
      const dayKey = `${yyyy}-${mm}-${dd}`;

      const minutesOfDay = t.getHours() * 60 + t.getMinutes();
      if (minutesOfDay < 0 || minutesOfDay >= MINUTES_PER_DAY) continue;

      const bucketIndex = Math.floor(minutesOfDay / BUCKET_MINUTES);
      if (bucketIndex < 0 || bucketIndex >= BUCKETS_PER_DAY) continue;

      if (!bucketMap.has(dayKey)) {
        bucketMap.set(dayKey, new Map());
      }

      if (!dateIndexMap.has(dayKey)) {
        dateIndexMap.set(dayKey, dateIndexMap.size);
      }

      const inner = bucketMap.get(dayKey)!;
      inner.set(bucketIndex, (inner.get(bucketIndex) ?? 0) + 1);
    }

    // Convert to flat array of dots
    const result: HealthDotPoint[] = [];
    // Sort days ascending
    const sortedDays = Array.from(bucketMap.keys()).sort();

    for (const dayLabel of sortedDays) {
      const bucket = bucketMap.get(dayLabel)!;

      for (const [bucketIndex, count] of bucket.entries()) {
        if (count <= 0) continue;

        const bucketStartMinutes = bucketIndex * BUCKET_MINUTES; // start of bucket
        result.push({
          dayLabel,
          minutesOfDay: bucketStartMinutes,
          timeLabel: formatMinutesToTime(bucketStartMinutes),
          count,
          dayIndex: dateIndexMap.get(dayLabel)!,
        });
      }
    }

    return result;
  }, [logs]);

  const loading = isLoading || isFetching;
  const hasDots = points.length > 0;

  const timeTicks = useMemo(
    () => Array.from({ length: 25 }, (_, i) => i * 60),
    []
  );

  return (
    <Paper
      sx={{
        p: 2,
        height: 420,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          mb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">Health Log Activity</Typography>
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

      {!loading && !isError && !hasDots && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No health action logs found for this agent.
          </Typography>
        </Box>
      )}

      {!loading && !isError && hasDots && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="5 5" strokeOpacity={0.6} />
              <XAxis
                name="Day"
                type="number"
                dataKey="dayIndex"
                tickFormatter={(value) => {
                  const point = points.find((p) => p.dayIndex === value);
                  return point ? point.dayLabel : "Invalid";
                }}
                ticks={Array.from(new Set(points.map((p) => p.dayIndex))).sort(
                  (a, b) => a - b
                )}
                tick={{ fontSize: 16 }}
              />
              <YAxis
                type="number"
                dataKey="minutesOfDay"
                name="Time"
                domain={[0, MINUTES_PER_DAY]}
                ticks={timeTicks}
                tickFormatter={formatMinutesToTime}
                tick={{ fontSize: 16 }}
              />

              <Scatter data={points} shape={<RenderDot />} />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

const RenderDot: FC<DotProps> = ({ cx, cy }) => {
  return (
    <Dot cx={cx} cy={cy} fill={ACTIVE_COLOR} r={2} shapeRendering={"square"} />
  );
};
export default HealthLogActivity;
