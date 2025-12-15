import { type TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useTheme } from "@mui/material/styles";

import { assetFileService, type AssetFile } from "@services/assetFileService";
import { actionLogService, type ActionLog } from "@services/actionLogService";

const ASSET_FILE_PAGE_SIZE = 2500;
const ACTION_LOG_PAGE_SIZE = 2500;
export const ACTIVE_COLOR = "#4caf50";
export const OFFLINE_COLOR = "#f44336";

export interface AssetFilePoint {
  date: string; // YYYY-MM-DD
  count: number;
}
export interface FetchByDateRangeParams {
  startDate?: string;
  endDate?: string;
}

// ---- ASSET FILES UTILS ----

// Helper to fetch ALL asset files for an agent (paginated)
export const fetchAllAssetFiles = async (
  agentId: string,
  { startDate, endDate }: FetchByDateRangeParams = {}
): Promise<AssetFile[]> => {
  const all: AssetFile[] = [];
  let offset = 0;
  let totalCount: number | null = null;

  // Loop through pages
  for (;;) {
    const res = await assetFileService.listByAgent({
      agentId,
      limit: ASSET_FILE_PAGE_SIZE,
      offset,
      // if backend supports this:
      sortField: "timestamp",
      sortOrder: "asc",
      startDate,
      endDate,
    });

    const batch = res.data ?? [];
    all.push(...batch);

    const metaTotal = res.meta?.count ?? batch.length;
    if (totalCount === null) {
      totalCount = metaTotal;
    }

    offset += batch.length;

    if (batch.length === 0 || (totalCount && offset >= totalCount)) {
      break;
    }
  }

  return all;
};

export const CustomRenderTooltipAssetFiles = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (!active || !payload || payload.length === 0) return null;

  const theme = useTheme();
  const point = payload[0].payload as AssetFilePoint;

  // --- INVERTED THEME BEHAVIOR ---
  const bg =
    theme.palette.mode === "light"
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(255, 255, 255, 0.95)";

  const textColor = theme.palette.mode === "light" ? "#fff" : "#000";

  const borderColor =
    theme.palette.mode === "light"
      ? "rgba(255,255,255,0.25)"
      : "rgba(0,0,0,0.2)";

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
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {new Date(label as string).toLocaleDateString()}
      </div>

      <div>
        Count: <strong>{point.count}</strong>
      </div>
    </div>
  );
};

// ---- ACTION LOGS UTILS ----

export async function fetchAllActionLogs(
  agentId: string,
  category: string,
  { startDate, endDate }: FetchByDateRangeParams = {}
): Promise<ActionLog[]> {
  const all: ActionLog[] = [];
  let offset = 0;
  let totalCount: number | null = null;

  for (;;) {
    const res = await actionLogService.listByAgent(agentId, {
      category,
      startDate,
      endDate,
      limit: ACTION_LOG_PAGE_SIZE,
      offset,
    });

    const batch = res.data ?? [];
    all.push(...batch);

    const metaTotal = res.meta?.count ?? batch.length;
    if (totalCount === null) {
      totalCount = metaTotal;
    }

    offset += batch.length;

    if (batch.length === 0 || (totalCount && offset >= totalCount)) {
      break;
    }
  }

  return all;
}
