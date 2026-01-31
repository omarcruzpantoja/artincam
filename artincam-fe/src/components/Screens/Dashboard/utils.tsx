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

// ---- ACTION LOGS UTILS ----

export const fetchAllActionLogs = async (
  agentId: string,
  category: string,
  { startDate, endDate }: FetchByDateRangeParams = {}
): Promise<ActionLog[]> => {
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
};
