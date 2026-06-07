import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config";
import type {
  ApiErrorPayload,
  CommentDto,
  CreateReportDto,
  ItemResponse,
  ListResponse,
  ReportDto,
  ReportListQuery,
  ReportWithAuthorDto,
  UpdateReportDto,
  UserDto,
} from "./dtos";

type BackendErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: string | null;
  };
};

let demoUserId: number = 1;

export function getDemoUserId(): number {
  return demoUserId;
}

export function setDemoUserId(id: number): void {
  demoUserId = id;
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("X-Demo-UserId", String(demoUserId));
  return headers;
}

function buildQuery(params: ReportListQuery): string {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.severity) search.set("severity", params.severity);
  if (params.status) search.set("status", params.status);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortDir) search.set("sortDir", params.sortDir);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function parseBackendError(
  status: number,
  rawText: string,
): ApiErrorPayload {
  let payload: BackendErrorBody | null = null;
  try {
    payload = rawText ? (JSON.parse(rawText) as BackendErrorBody) : null;
  } catch {
    payload = null;
  }

  return {
    status,
    code: payload?.error?.code ?? "HTTP_ERROR",
    message: payload?.error?.message ?? `HTTP ${status}`,
    details: payload?.error?.details ?? (rawText || null),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = buildHeaders(options.headers);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal });
  } catch (error) {
    const err: ApiErrorPayload = {
      status: 0,
      code: "NETWORK_ERROR",
      message: "Помилка мережі або CORS",
      details: error instanceof Error ? error.message : String(error),
    };
    throw err;
  }

  if (response.status === 204) {
    return null as T;
  }

  const rawText = await response.text();

  if (response.ok) {
    if (!rawText) {
      return null as T;
    }
    return JSON.parse(rawText) as T;
  }

  throw parseBackendError(response.status, rawText);
}

export function withTimeout(
  executor: (signal: AbortSignal) => Promise<void>,
): { promise: Promise<void>; abort: () => void } {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const promise = executor(controller.signal).finally(() => {
    window.clearTimeout(timeoutId);
  });

  return {
    promise,
    abort: () => controller.abort(),
  };
}

let usersCache: UserDto[] | null = null;

export function invalidateUsersCache(): void {
  usersCache = null;
}

export async function getUsers(signal?: AbortSignal): Promise<UserDto[]> {
  if (usersCache) {
    return usersCache;
  }
  const result = await request<ListResponse<UserDto>>(
    "/users?page=1&pageSize=100&sortBy=name&sortDir=asc",
    {},
    signal,
  );
  usersCache = result.data;
  return usersCache;
}

export async function getReports(
  query: ReportListQuery,
  signal?: AbortSignal,
): Promise<ListResponse<ReportWithAuthorDto>> {
  return request<ListResponse<ReportWithAuthorDto>>(
    `/reports/with-authors${buildQuery(query)}`,
    {},
    signal,
  );
}

export async function getReportById(
  id: number,
  signal?: AbortSignal,
): Promise<ReportWithAuthorDto> {
  const result = await request<ItemResponse<ReportWithAuthorDto>>(
    `/reports/${id}`,
    {},
    signal,
  );
  return result.data;
}

export async function getCommentsByReportId(
  reportId: number,
  signal?: AbortSignal,
): Promise<CommentDto[]> {
  const result = await request<ListResponse<CommentDto>>(
    `/comments?reportId=${reportId}&page=1&pageSize=50&sortBy=id&sortDir=asc`,
    {},
    signal,
  );
  return result.data;
}

export async function createReport(
  dto: CreateReportDto,
  signal?: AbortSignal,
): Promise<ReportWithAuthorDto> {
  const result = await request<ItemResponse<ReportDto>>(
    "/reports",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dto, userId: demoUserId }),
    },
    signal,
  );
  return getReportById(result.data.id, signal);
}

export async function updateReport(
  id: number,
  dto: UpdateReportDto,
  signal?: AbortSignal,
): Promise<ReportWithAuthorDto> {
  await request<ItemResponse<ReportDto>>(
    `/reports/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dto, userId: demoUserId }),
    },
    signal,
  );
  return getReportById(id, signal);
}

export async function deleteReport(
  id: number,
  signal?: AbortSignal,
): Promise<void> {
  await request<null>(`/reports/${id}`, { method: "DELETE" }, signal);
}
