import ReactEchart from "@components/base/ReactEchart";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import type { ActionLog } from "@services/actionLogService";
import { useQuery } from "@tanstack/react-query";
import { ScatterChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";

// ✅ ECharts
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { type FC, useMemo } from "react";
import { useFilter } from "./contexts/FilterContext";
import { ACTIVE_COLOR, fetchAllActionLogs } from "./utils";

echarts.use([
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface ActionLogHealthDotsMatrixChartProps {
  agentId: string | null;
}

// One dot per (day, 5-min bucket) that has >=1 logs
interface HealthDotPoint {
  dayLabel: string; // "2025-12-08" (UTC)
  dayIndex: number;
  minutesOfDay: number; // 0..1440 (minute index)
  timeLabel: string; // "HH:MM" (UTC) for tooltip
  count: number; // number of logs in that bucket
}

const BUCKET_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;
const BUCKETS_PER_DAY = MINUTES_PER_DAY / BUCKET_MINUTES; // 288

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// YYYY-MM-DD from UTC date/time
function ymdUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate(),
  )}`;
}

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function addUTCDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

// Format minutes since midnight into "HH:MM"
const formatMinutesToTime = (minutes: number): string => {
  const m = Math.floor(minutes);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const HealthLogActivity: FC<ActionLogHealthDotsMatrixChartProps> = ({
  agentId,
}) => {
  const { applied } = useFilter();
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

  // ✅ Build the list of days in the applied range (UTC, inclusive)
  const daysInRange: string[] = useMemo(() => {
    if (!applied.start || !applied.end) return [];

    const start = startOfUTCDay(applied.start);
    const end = startOfUTCDay(applied.end);
    if (end.getTime() < start.getTime()) return [];

    const out: string[] = [];
    for (
      let cur = new Date(start);
      cur.getTime() <= end.getTime();
      cur = addUTCDays(cur, 1)
    ) {
      out.push(ymdUTC(cur));
    }
    return out;
  }, [applied.start, applied.end]);

  // Build dot matrix: X = day, Y = time-of-day bucket (UTC)
  const { points, dayLabels } = useMemo(() => {
    // Stable list of days we want on the axis:
    // - if filter is set => all days in range
    // - else => only observed days from logs
    let days: string[] = [];

    // Map of date -> bucketIndex -> count
    const bucketMap = new Map<string, Map<number, number>>();

    // Use a copy so we don't mutate react-query cached array
    const logsCopy = [...logs];
    logsCopy.reverse();

    for (const log of logsCopy) {
      if (!log.created_at) continue;

      const t = new Date(log.created_at);
      if (Number.isNaN(t.getTime())) continue;

      // UTC day key
      const dayKey = ymdUTC(t);

      // UTC minutes-of-day
      const minutesOfDay = t.getUTCHours() * 60 + t.getUTCMinutes();
      if (minutesOfDay < 0 || minutesOfDay >= MINUTES_PER_DAY) continue;

      const bucketIndex = Math.floor(minutesOfDay / BUCKET_MINUTES);
      if (bucketIndex < 0 || bucketIndex >= BUCKETS_PER_DAY) continue;

      if (!bucketMap.has(dayKey)) bucketMap.set(dayKey, new Map());
      // biome-ignore lint/style/noNonNullAssertion: <Day should always exist in the bucket.>
      const inner = bucketMap.get(dayKey)!;
      inner.set(bucketIndex, (inner.get(bucketIndex) ?? 0) + 1);
    }

    if (daysInRange.length > 0) {
      days = daysInRange;
    } else {
      days = Array.from(bucketMap.keys()).sort();
    }

    const indexMap = new Map<string, number>();
    days.forEach((d, i) => {
      indexMap.set(d, i);
    });

    // Convert to flat array of dots
    const result: HealthDotPoint[] = [];

    for (const dayLabel of days) {
      const bucket = bucketMap.get(dayLabel);
      if (!bucket) continue;

      for (const [bucketIndex, count] of bucket.entries()) {
        if (count <= 0) continue;

        const bucketStartMinutes = bucketIndex * BUCKET_MINUTES;
        result.push({
          dayLabel,
          minutesOfDay: bucketStartMinutes,
          timeLabel: formatMinutesToTime(bucketStartMinutes),
          count,
          // biome-ignore lint/style/noNonNullAssertion: <The day will always exist.>
          dayIndex: indexMap.get(dayLabel)!,
        });
      }
    }

    return {
      points: result,
      dayLabels: days,
    };
  }, [logs, daysInRange]);

  const loading = isLoading || isFetching;

  // ✅ now "hasDots" isn't the same as "hasDays"
  const hasDays = dayLabels.length > 0;
  const hasDots = points.length > 0;

  const option = useMemo(() => {
    // ECharts scatter points as [x, y, count, dayLabel, timeLabel]
    const data = points.map((p) => [
      p.dayIndex,
      p.minutesOfDay,
      p.count,
      p.dayLabel,
      p.timeLabel,
    ]);

    return {
      animation: false,
      grid: { left: 56, right: 16, top: 10, bottom: 42 },
      tooltip: {
        trigger: "item",
        formatter: (params: { value?: unknown }) => {
          const v = params?.value;
          if (!v || !Array.isArray(v)) return "";
          const count = v[2];
          const dayLabel = v[3];
          const timeLabel = v[4];
          return `${dayLabel}<br/>${timeLabel} UTC<br/>Count: <b>${count}</b>`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: Math.max(0, dayLabels.length - 1),
        interval: 1,
        axisLabel: {
          fontSize: 12,
          formatter: (value: number) => dayLabels[value] ?? "Invalid",
          hideOverlap: true,
        },
        splitLine: {
          show: true,
          lineStyle: { type: "dashed", opacity: 0.6 },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: MINUTES_PER_DAY,
        // If you want EXACT tick positions like Recharts:
        axisLabel: {
          fontSize: 14,
          formatter: (value: number) => formatMinutesToTime(value),
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { type: "dashed", opacity: 0.6 },
        },
      },
      series: [
        {
          type: "scatter",
          data,
          symbol: "rect",
          symbolSize: 4, // ~ r=2 square
          itemStyle: { color: ACTIVE_COLOR },
          emphasis: { scale: false },
        },
      ],
    };
  }, [points, dayLabels]);

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

  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
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

      {/* ✅ If there are no days (e.g., no range + no logs) */}
      {!loading && !isError && !hasDays && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No data available.
          </Typography>
        </Box>
      )}

      {/* ✅ If days exist but there are no dots */}
      {!loading && !isError && hasDays && !hasDots && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No health action logs found for this date range.
          </Typography>
        </Box>
      )}

      {!loading && !isError && hasDays && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ReactEchart
            echarts={echarts}
            option={option}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>
      )}
    </Card>
  );
};

export default HealthLogActivity;
