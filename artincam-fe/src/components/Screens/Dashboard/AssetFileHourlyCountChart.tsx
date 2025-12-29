import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
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
import { fetchAllAssetFiles } from "./utils";
import { useFilter } from "./contexts/FilterContext";

interface AssetFileHourlyCountChartProps {
  agentId: string | null;
}

type DayMeanPoint = {
  date: string; // "YYYY-MM-DD" (UTC day key)
  meanPerHour: number;
  total: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// ---- UTC helpers ----
function dayKeyUTC(d: Date): string {
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

// parse "YYYY-MM-DD" as UTC midnight
function utcDateFromYMD(ymd: string): Date {
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0));
}

// --- Tooltip (UTC-aware, same inverted theme style) ---
const CustomRenderTooltipDailyMean = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (!active || !payload || payload.length === 0) return null;

  const theme = useTheme();
  const point = payload[0].payload as DayMeanPoint;

  const bg =
    theme.palette.mode === "light"
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(255, 255, 255, 0.95)";

  const textColor = theme.palette.mode === "light" ? "#fff" : "#000";

  const borderColor =
    theme.palette.mode === "light"
      ? "rgba(255,255,255,0.25)"
      : "rgba(0,0,0,0.2)";

  // label is YYYY-MM-DD (UTC day key). Render consistently in UTC.
  let dateLabel = String(label);
  try {
    const dt = utcDateFromYMD(String(label));
    dateLabel = dt.toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeZone: "UTC",
    });
  } catch {
    // fallback
  }

  return (
    <div
      style={{
        background: bg,
        color: textColor,
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 12,
        border: `1px solid ${borderColor}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 0 6px rgba(0,0,0,0.15)"
            : "0 0 8px rgba(0,0,0,0.6)",
        minWidth: 190,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{dateLabel}</div>

      <div>
        Mean images/hour: <strong>{point.meanPerHour.toFixed(2)}</strong>
      </div>
      <div style={{ marginTop: 4, opacity: 0.9 }}>
        Total images: <strong>{point.total}</strong>
      </div>
    </div>
  );
};

const AssetFileHourlyCountChart = ({
  agentId,
}: AssetFileHourlyCountChartProps) => {
  const { applied } = useFilter();

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
          Select an agent to view daily mean images.
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
    queryKey: [
      "dashboard",
      "asset-files-daily-mean",
      agentId,
      applied.start,
      applied.end,
    ],
    queryFn: () =>
      fetchAllAssetFiles(agentId, {
        startDate: applied.start?.toISOString(),
        endDate: applied.end?.toISOString(),
      }),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });

  const dailyData: DayMeanPoint[] = useMemo(() => {
    // If you want to show days with 0 even when there are no files at all,
    // keep this behavior; otherwise you can early-return [] when no files.
    // We'll respect your "days with no values default 0" requirement,
    // which requires a valid applied date range.
    const byDay: Record<string, number> = {};

    for (const f of files) {
      if (!f.timestamp) continue;
      const dt = new Date(f.timestamp);
      if (Number.isNaN(dt.getTime())) continue;

      const dk = dayKeyUTC(dt);
      byDay[dk] = (byDay[dk] ?? 0) + 1;
    }

    const hasRange = applied.start && applied.end;

    // If no applied range, fall back to observed days only (still UTC)
    if (!hasRange) {
      const observedDays = Object.keys(byDay).sort();
      return observedDays.map((date) => {
        const total = byDay[date] ?? 0;
        return { date, total, meanPerHour: total / 24 };
      });
    }

    // Fill every day in [start..end] inclusive (UTC)
    const rangeStart = startOfUTCDay(applied.start!);
    const rangeEnd = startOfUTCDay(applied.end!);

    if (rangeEnd.getTime() < rangeStart.getTime()) {
      const observedDays = Object.keys(byDay).sort();
      return observedDays.map((date) => {
        const total = byDay[date] ?? 0;
        return { date, total, meanPerHour: total / 24 };
      });
    }

    const points: DayMeanPoint[] = [];
    for (
      let cur = new Date(rangeStart);
      cur.getTime() <= rangeEnd.getTime();
      cur = addUTCDays(cur, 1)
    ) {
      const date = dayKeyUTC(cur);
      const total = byDay[date] ?? 0; // ✅ missing days -> 0
      points.push({ date, total, meanPerHour: total / 24 });
    }

    return points;
  }, [files, applied.start, applied.end]);

  const loading = isLoading || isFetching;

  return (
    <Paper sx={{ p: 2, height: 420, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          mb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">Mean images per hour</Typography>
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
              <XAxis
                dataKey="date"
                fontSize={12}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis fontSize={16} allowDecimals />
              <Tooltip
                content={CustomRenderTooltipDailyMean}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="meanPerHour"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default AssetFileHourlyCountChart;
