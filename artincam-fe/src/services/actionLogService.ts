import {
  BaseApiService,
  type ApiResponse,
  type RequestOptions,
} from "./baseService";

// ---- Types ----

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
  limit?: number;
  offset?: number;
}

// ---- Service ----

class ActionLogService extends BaseApiService {
  constructor() {
    super();
  }

  async list(
    params: ListActionLogsParams = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<ActionLog[]>> {
    const { agentId, category, limit, offset } = params;

    return this.get<ActionLog[]>("/action-logs", {
      ...options,
      query: {
        agent_id: agentId,
        category,
        limit,
        offset,
        ...(options.query ?? {}),
      },
    });
  }

  async listByAgent(
    agentId: string,
    params: Omit<ListActionLogsParams, "agentId"> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<ActionLog[]>> {
    return this.list(
      {
        agentId,
        ...params,
      },
      options
    );
  }
}

// singleton
export const actionLogService = new ActionLogService();
export default actionLogService;
