import {
  type ApiResponse,
  BaseApiService,
  type RequestOptions,
} from "./baseService";

const ACTION_LOG_PATH = "/api/v1/action-logs";

export interface ActionLog {
  id: number;
  agent_id: string;
  message: unknown; // backend: interface{} / JSON
  category: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ListActionLogsParams {
  agentId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

class ActionLogService extends BaseApiService {
  async list(
    params: ListActionLogsParams = {},
  ): Promise<ApiResponse<ActionLog[]>> {
    const { agentId, category, limit, offset, startDate, endDate } = params;

    const query: RequestOptions["query"] = {
      agent_id: agentId,
      limit,
      offset,
    };

    if (category) query.category = category;
    if (startDate) query.start_date = startDate;
    if (endDate) query.end_date = endDate;

    return this.get<ActionLog[]>(ACTION_LOG_PATH, {
      query: query,
    });
  }

  async listByAgent(
    agentId: string,
    params: Omit<ListActionLogsParams, "agentId"> = {},
  ): Promise<ApiResponse<ActionLog[]>> {
    return this.list({
      agentId,
      ...params,
    });
  }
}

// singleton
export const actionLogService = new ActionLogService();
export default actionLogService;
