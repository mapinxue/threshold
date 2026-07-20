export type UserRole = "admin" | "user";
export type UserStatus = "active" | "disabled";

export type User = {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  tenant_slug: string;
  user: User;
};

export type Dashboard = {
  users: number;
  data_sources: number;
  api_keys: number;
  permissions: number;
  skills: number;
};

export type DataSource = {
  id: string;
  tenant_id: string;
  owner_user_id: string | null;
  name: string;
  engine: string;
  host: string | null;
  port: number | null;
  database_name: string | null;
  credential_ref: string | null;
  status: "draft" | "connected" | "disabled";
  created_at: string;
};

export type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

export type ApiKeyCreated = ApiKey & { secret: string };

export type Permission = {
  id: string;
  user_id: string;
  user_email: string;
  data_source_id: string;
  data_source_name: string;
  access_level: "read" | "write" | "admin";
  created_at: string;
};

export type Skill = {
  id: string;
  data_source_id: string;
  data_source_name: string;
  name: string;
  description: string;
  content: string;
  status: "ready";
  created_at: string;
};

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token !== undefined) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const request: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };
  if (options.body !== undefined) {
    request.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, request);

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
