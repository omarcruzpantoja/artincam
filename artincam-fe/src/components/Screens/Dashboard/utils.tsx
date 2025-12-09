import { type TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useTheme } from "@mui/material/styles";

import { assetFileService, type AssetFile } from "@services/assetFileService";
const PAGE_SIZE = 500;

export interface AssetFilePoint {
  date: string; // YYYY-MM-DD
  count: number;
}

// Helper to fetch ALL asset files for an agent (paginated)
export const fetchAllAssetFiles = async (
  agentId: string
): Promise<AssetFile[]> => {
  const all: AssetFile[] = [];
  let offset = 0;
  let totalCount: number | null = null;

  // Loop through pages
  for (;;) {
    const res = await assetFileService.listByAgent({
      agentId,
      limit: PAGE_SIZE,
      offset,
      // if backend supports this:
      sortField: "timestamp",
      sortOrder: "asc",
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

export interface AssetFilePoint {
  date: string;
  count: number;
}

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
