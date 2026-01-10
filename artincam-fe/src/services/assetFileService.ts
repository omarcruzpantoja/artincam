// assetFileService.ts
import {
  BaseApiService,
  type ApiResponse,
  type RequestOptions,
} from "./baseService";

const ASSET_FILE_PATH = "/api/v1/asset-files";

export interface AssetFile {
  id: number;
  agent_id: string;
  camera_id: string;
  location: string;
  timestamp: string;
  unique_id: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export type SortOrder = "asc" | "desc";

export interface ListAssetFilesParams {
  agentId: string;
  limit?: number;
  offset?: number;
  sortField?: string;
  sortOrder?: SortOrder;
  startDate?: string;
  endDate?: string;
}

export class AssetFileService extends BaseApiService {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  listByAgent(params: ListAssetFilesParams): Promise<ApiResponse<AssetFile[]>> {
    const { agentId, limit, offset, sortField, sortOrder, startDate, endDate } =
      params;

    if (!agentId) {
      throw new Error("agentId is required to list asset files");
    }

    const options: RequestOptions["query"] = {
      agent_id: agentId,
      limit,
      offset,
      sort_field: sortField,
      sort_order: sortOrder,
    };
    if (startDate) options.start_date = startDate;
    if (endDate) options.end_date = endDate;

    return this.get<AssetFile[]>(ASSET_FILE_PATH, { query: options });
  }

  async getContentBlob(assetFileId: number): Promise<Blob> {
    const res = await this.getBlob<Blob>(
      `${ASSET_FILE_PATH}/${assetFileId}/content`
    );

    return res;
  }
}

export const assetFileService = new AssetFileService();
