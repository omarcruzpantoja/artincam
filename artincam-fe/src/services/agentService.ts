import {
  BaseApiService,
  type ApiResponse,
  type QueryParams,
} from "./baseService";

const AGENT_PATH = "/api/v1/agents";

export type AgentStatus = "ACTIVE" | "STOPPED" | "FAILURE";

interface Transforms {
  vertical_flip: boolean;
  horizontal_flip: boolean;
}

interface RtspStream {
  address: string;
}

interface Resolution {
  width: number;
  height: number;
}

interface Camera {
  mode: string;
  status?: AgentStatus;
  resolution: Resolution;
  rtsp_stream?: RtspStream | null;
  transforms: Transforms;
  framerate?: number;
  bitrate?: number | null;
  recording_time?: number;
  recording_time_unit?: string;
  cycle_rest_time?: number;
  cycle_rest_time_unit?: string;
  output_dir: string;
  location: string;
  pi_id: number;
  image_capture_time?: number;
  image_capture_time_unit?: string;
  image_rest_time?: number;
  image_rest_time_unit?: string;
}

interface ArtincamPiAgentConfig {
  camera: Camera;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type_id: number;
  config: ArtincamPiAgentConfig;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAgentPayload {
  name: string;
  location?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateAgentPayload {
  name?: string;
  location?: string;
  description?: string;
  tags?: string[];
  status?: AgentStatus;
}

export interface ListAgentsParams {
  status?: AgentStatus;
  search?: string;
  // add pagination keys if your backend supports them
  page?: number;
  pageSize?: number;
}

export class AgentService extends BaseApiService {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  listAgents(params?: ListAgentsParams): Promise<ApiResponse<Agent[]>> {
    let query: QueryParams | undefined;

    if (params) {
      query = {};

      if (params.status !== undefined) {
        query.status = params.status;
      }
      if (params.search !== undefined) {
        query.search = params.search;
      }
      if (params.page !== undefined) {
        query.page = params.page;
      }
      if (params.pageSize !== undefined) {
        query.pageSize = params.pageSize;
      }
    }

    return this.get<Agent[]>(AGENT_PATH, { query });
  }

  getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.get<Agent>(`${AGENT_PATH}/${encodeURIComponent(id)}`);
  }

  createAgent(payload: CreateAgentPayload): Promise<ApiResponse<Agent>> {
    return this.post<Agent, CreateAgentPayload>(AGENT_PATH, payload);
  }

  updateAgent(
    id: string,
    payload: UpdateAgentPayload
  ): Promise<ApiResponse<Agent>> {
    return this.put<Agent, UpdateAgentPayload>(
      `${AGENT_PATH}/${encodeURIComponent(id)}`,
      payload
    );
  }

  deleteAgent(id: string): Promise<void> {
    return this.delete(`${AGENT_PATH}/${encodeURIComponent(id)}`);
  }
}

// Singleton you can import everywhere
export const agentService = new AgentService();
