export interface ApiResponse<T> {
  meta: any | null;
  data: T;
}
export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type QueryParams = {
  [key: string]: string | number | boolean | undefined;
};
export interface RequestOptions extends RequestInit {
  // Allow any plain object with string keys
  query?: QueryParams;
}

export const getServerHost = () => {
  // If opened from a real host/IP, use it.
  // If opened from file:// or some weird context, fallback to localhost.
  const host = window.location.hostname;
  return host && host.length > 0 ? host : "127.0.0.1";
};

export class BaseApiService {
  protected readonly baseUrl: string;

  constructor(baseUrl?: string) {
    function getServerHost() {
      // If opened from a real host/IP, use it.
      // If opened from file:// or some weird context, fallback to localhost.
      const host = window.location.hostname;
      return host && host.length > 0 ? host : "127.0.0.1";
    }
    this.baseUrl = baseUrl ?? `http://${getServerHost()}:8080`;
  }

  protected buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  protected getAuthToken(): string | null {
    // Adjust this to your real auth mechanism
    return localStorage.getItem("access_token");
  }

  protected buildHeaders(extra?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...extra,
    };

    // const token = this.getAuthToken();
    // if (token) {
    //   (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    // }

    return headers;
  }

  protected async request<TResponse = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { query, headers, ...restOptions } = options;

    const url = this.buildUrl(path, query);

    const init: RequestInit = {
      method,
      headers: this.buildHeaders(headers),
      ...restOptions,
    };

    if (body !== undefined && body !== null && method !== "GET") {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    let responseData: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else if (contentType.startsWith("text/")) {
      responseData = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = new Error(
        `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.details = responseData;
      throw error;
    }

    return responseData as TResponse;
  }

  protected get<T>(
    path: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>("GET", path, undefined, options);
  }

  protected post<T = unknown, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>("POST", path, body, options);
  }

  protected put<T = unknown, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>("PUT", path, body, options);
  }

  protected patch<T = unknown, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>("PATCH", path, body, options);
  }

  protected delete(path: string, options?: RequestOptions): Promise<void> {
    return this.request<void>("DELETE", path, undefined, options);
  }
}
