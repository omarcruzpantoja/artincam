import {
  BaseApiService,
  type ApiResponse,
  type QueryParams,
} from "./baseService";

const AGENT_PATH = "/api/v1/agents";

export type AgentStatus = "ACTIVE" | "STOPPED" | "FAILURE";
export type TimeUnit = "s" | "m" | "h" | "d";
export type CameraMode = "rtsp_stream" | "video" | "image" | "image/video";

export interface CameraTransforms {
  vertical_flip: boolean;
  horizontal_flip: boolean;
}

export interface RtspStream {
  address: string;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface CameraConfig {
  mode: CameraMode;
  status?: AgentStatus;
  resolution: Resolution;
  rtsp_stream?: RtspStream | null;
  transforms: CameraTransforms;
  framerate?: number;
  bitrate?: number | null;
  recording_time?: number;
  recording_time_unit?: TimeUnit;
  cycle_rest_time?: number;
  cycle_rest_time_unit?: TimeUnit;
  output_dir: string;
  location: string;
  pi_id: number;
  image_capture_time?: number;
  image_capture_time_unit?: TimeUnit;
  image_rest_time?: number;
  image_rest_time_unit?: TimeUnit;
}

export interface ArtincamPiAgentConfig {
  camera: CameraConfig;
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

export interface WriteAgentPayload {
  name: string;
  description: string;
  agent_type_id: number;
  config: ArtincamPiAgentConfig;
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

  createAgent(payload: WriteAgentPayload): Promise<ApiResponse<Agent>> {
    return this.post<Agent, WriteAgentPayload>(AGENT_PATH, payload);
  }

  updateAgent(
    id: string,
    payload: WriteAgentPayload
  ): Promise<ApiResponse<Agent>> {
    return this.patch<Agent, WriteAgentPayload>(
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
