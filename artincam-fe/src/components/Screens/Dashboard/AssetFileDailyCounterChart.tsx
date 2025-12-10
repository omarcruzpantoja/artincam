import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AssetFile } from "@services/assetFileService";
import {
  CustomRenderTooltipAssetFiles,
  fetchAllAssetFiles,
  type AssetFilePoint,
} from "./utils";

interface AssetFileDailyCountChartProps {
  agentId: string | null;
}

const AssetFileDailyCountChart = ({
  agentId,
}: AssetFileDailyCountChartProps) => {
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

  const {
    data: files = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<AssetFile[], Error>({
    queryKey: ["dashboard", "asset-files", agentId],
    queryFn: () => fetchAllAssetFiles(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });

  // ---- Aggregate: total files per day (non-cumulative) ----
  const dailyData: AssetFilePoint[] = useMemo(() => {
    if (!files.length) return [];

    const byDate: Record<string, number> = {};

    for (const f of files) {
      if (!f.timestamp) continue;
      const d = new Date(f.timestamp);
      if (Number.isNaN(d.getTime())) continue;

      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      byDate[dateKey] = (byDate[dateKey] ?? 0) + 1;
    }

    const sortedDates = Object.keys(byDate).sort();

    return sortedDates.map((date) => ({
      date,
      count: byDate[date],
    }));
  }, [files]);

  const loading = isLoading || isFetching;

  // ---- Render ----

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
        <Typography variant="subtitle1">Total Images Per Day</Typography>
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="5 5" strokeOpacity={0.6} />
              <XAxis dataKey="date" fontSize={16} />
              <YAxis allowDecimals={false} fontSize={16} />
              <Tooltip
                content={CustomRenderTooltipAssetFiles}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="count"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default AssetFileDailyCountChart;
