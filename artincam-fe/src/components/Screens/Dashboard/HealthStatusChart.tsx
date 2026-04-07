import ReactEchart from "@components/base/ReactEchart";
import {
  Alert,
  Box,
  Card,
  CardHeader,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import type { ActionLog } from "@services/actionLogService";
import { useQuery } from "@tanstack/react-query";
import { PieChart } from "echarts/charts";
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useFilter } from "./contexts/FilterContext";
import { ACTIVE_COLOR, fetchAllActionLogs, OFFLINE_COLOR } from "./utils";

echarts.use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

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

const HealthStatusBreakdownChart = ({
  agentId,
}: HealthStatusBreakdownChartProps) => {
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
      bucketMap.get(dayKey)?.add(bucketIndex);
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

  const option = useMemo(() => {
    if (breakdown.totalBuckets === 0) return null;

    return {
      animation: false,
      tooltip: {
        trigger: "item",
        formatter: (p: { name?: string; value?: number }) => {
          const name = p?.name ?? "";
          const value = p?.value ?? 0;
          return `${name}: <b>${value}%</b>`;
        },
      },
      legend: {
        show: true,
        orient: "horizontal",
        bottom: 0,
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: "Status",
          type: "pie",
          radius: ["45%", "72%"], // donut-ish like a modern dashboard
          center: ["50%", "45%"],
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: (p: { name: string; value: number }) =>
              `${p.name}: ${p.value}%`,
          },
          labelLine: {
            show: true,
          },
          data: [
            {
              name: "Active",
              value: breakdown.activePct,
              itemStyle: { color: STATUS_COLORS.active },
            },
            {
              name: "Offline",
              value: breakdown.offlinePct,
              itemStyle: { color: STATUS_COLORS.offline },
            },
          ],
        },
      ],
    };
  }, [breakdown.totalBuckets, breakdown.activePct, breakdown.offlinePct]);

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

  return (
    <Card
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title={<Typography variant="subtitle1">Status Breakdown</Typography>}
      />
      <Divider />

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

      {!loading && !isError && breakdown.totalBuckets > 0 && option && (
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

export default HealthStatusBreakdownChart;
