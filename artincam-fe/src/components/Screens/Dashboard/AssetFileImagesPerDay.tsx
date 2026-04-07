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
import type { AssetFile } from "@services/assetFileService";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useFilter } from "./contexts/FilterContext";
import { type AssetFilePoint, fetchAllAssetFiles } from "./utils";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface AssetFileDailyCountChartProps {
  agentId: string | null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayKeyUTC(d: Date): string {
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

const AssetFileDailyCountChart = ({
  agentId,
}: AssetFileDailyCountChartProps) => {
  const { applied } = useFilter();
  const {
    data: files = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<AssetFile[], Error>({
    queryKey: ["dashboard", "asset-files", agentId, applied.start, applied.end],
    queryFn: () =>
      fetchAllAssetFiles(agentId, {
        startDate: applied.start?.toISOString(),
        endDate: applied.end?.toISOString(),
      }),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });

  // ---- Aggregate: total files per day (non-cumulative), fill missing days with 0 ----
  const dailyData: AssetFilePoint[] = useMemo(() => {
    const byDate: Record<string, number> = {};

    for (const f of files) {
      if (!f.timestamp) continue;
      const d = new Date(f.timestamp);
      if (Number.isNaN(d.getTime())) continue;

      const dateKey = dayKeyUTC(d); // ✅ UTC day key
      byDate[dateKey] = (byDate[dateKey] ?? 0) + 1;
    }

    // If we have an applied range, fill every day in that range (inclusive)
    if (applied.start && applied.end) {
      const rangeStart = startOfUTCDay(applied.start);
      const rangeEnd = startOfUTCDay(applied.end);

      // guard: if end < start, fall back to observed
      if (rangeEnd.getTime() < rangeStart.getTime()) {
        const sorted = Object.keys(byDate).sort();
        return sorted.map((date) => ({ date, count: byDate[date] ?? 0 }));
      }

      const points: AssetFilePoint[] = [];
      for (
        let cur = new Date(rangeStart);
        cur.getTime() <= rangeEnd.getTime();
        cur = addUTCDays(cur, 1)
      ) {
        const key = dayKeyUTC(cur);
        points.push({
          date: key,
          count: byDate[key] ?? 0, // ✅ default missing to 0
        });
      }
      return points;
    }

    // No applied range -> just show observed days
    const sortedDates = Object.keys(byDate).sort();
    return sortedDates.map((date) => ({
      date,
      count: byDate[date] ?? 0,
    }));
  }, [files, applied.start, applied.end]);

  const loading = isLoading || isFetching;

  // Early UI when no agent selected
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
          Select an agent to view files per day.
        </Typography>
      </Paper>
    );
  }

  return (
    <Card
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Total images per day
          </Typography>
        }
      />
      <Divider sx={{ my: 1 }} />
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
            {error?.message ?? "Failed to load asset files."}
          </Alert>
        </Box>
      )}

      {!loading && !isError && dailyData.length === 0 && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No files found for this agent yet.
          </Typography>
        </Box>
      )}

      {!loading && !isError && dailyData.length > 0 && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ReactEchart
            echarts={echarts}
            option={{
              grid: { left: 44, right: 16, top: 12, bottom: 36 },
              xAxis: {
                type: "category",
                data: dailyData.map((d) => d.date),
                axisLabel: {
                  fontSize: 12,
                  hideOverlap: true,
                },
                axisTick: { alignWithLabel: true },
              },
              yAxis: {
                type: "value",
                minInterval: 1,
                axisLabel: { fontSize: 16 },
                splitLine: {
                  show: true,
                  lineStyle: {
                    type: "dashed",
                    opacity: 0.6,
                  },
                },
              },
              tooltip: {
                trigger: "axis",
                formatter: (params: unknown) => {
                  const p = Array.isArray(params) ? params[0] : params;
                  const date = p.axisValue;
                  const count = p.data;
                  return `${date}<br/>Count: <b>${count}</b>`;
                },
              },
              series: [
                {
                  name: "count",
                  type: "line",
                  data: dailyData.map((d) => d.count),
                  smooth: false, // type="linear"
                  symbol: "none", // dot={false}
                  lineStyle: {
                    width: 2,
                    color: "#1976d2", // replace with theme if you want
                  },
                },
              ],
              animation: false, // matches isAnimationActive={false}
            }}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>
      )}
    </Card>
  );
};

export default AssetFileDailyCountChart;
