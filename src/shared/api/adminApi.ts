import { runtimeEnv } from "../config/env";

export interface SuccessResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export interface ProblemDetail {
  status?: number;
  code?: string;
  message?: string;
  detail?: string;
  path?: string;
}

export type AdminApiErrorKind = "unauthorized" | "forbidden" | "http" | "network";

export class AdminApiError extends Error {
  readonly kind: AdminApiErrorKind;
  readonly status?: number;
  readonly problem?: ProblemDetail;

  constructor(kind: AdminApiErrorKind, message: string, status?: number, problem?: ProblemDetail) {
    super(message);
    this.name = "AdminApiError";
    this.kind = kind;
    this.status = status;
    this.problem = problem;
  }

  static async fromResponse(response: Response) {
    const problem = await readProblemDetail(response);
    const message = problem?.message || problem?.detail || response.statusText;

    if (response.status === 401) {
      return new AdminApiError("unauthorized", message, response.status, problem);
    }

    if (response.status === 403) {
      return new AdminApiError("forbidden", message, response.status, problem);
    }

    return new AdminApiError("http", message, response.status, problem);
  }
}

type AdminApiBody = BodyInit | object | null;

export interface AdminApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: AdminApiBody;
  accessToken?: string | null;
  rawResponse?: boolean;
  skipAuthRefresh?: boolean;
}

let currentAccessToken: string | null = null;
let unauthorizedHandler: (() => boolean | Promise<boolean>) | null = null;

export function setAdminAccessToken(accessToken: string | null) {
  currentAccessToken = accessToken;
}

export function clearAdminAccessToken() {
  currentAccessToken = null;
}

export function setAdminUnauthorizedHandler(handler: (() => boolean | Promise<boolean>) | null) {
  unauthorizedHandler = handler;
}

export async function adminApi<T>(path: string, options: AdminApiRequestOptions = {}): Promise<T> {
  const {
    accessToken,
    body,
    headers: initialHeaders,
    rawResponse = false,
    skipAuthRefresh = false,
    ...requestInit
  } = options;
  const headers = new Headers(initialHeaders);
  const resolvedToken = accessToken === undefined ? currentAccessToken : accessToken;
  const requestBody = serializeBody(body, headers);

  headers.set("Accept", "application/json");

  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }

  try {
    const response = await fetch(resolveUrl(path), {
      ...requestInit,
      headers,
      body: requestBody
    });

    if (!response.ok) {
      const error = await AdminApiError.fromResponse(response);

      if (error.kind === "unauthorized" && !skipAuthRefresh) {
        const didRefresh = await unauthorizedHandler?.();

        if (didRefresh) {
          return adminApi<T>(path, {
            ...options,
            skipAuthRefresh: true
          });
        }
      }

      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (rawResponse) {
      return (await response.json()) as T;
    }

    const payload = (await response.json()) as SuccessResponse<T>;
    return payload.data as T;
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }

    throw new AdminApiError("network", error instanceof Error ? error.message : "Network request failed");
  }
}

function resolveUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${runtimeEnv.adminApiBaseUrl}${normalizedPath}`;
}

function serializeBody(body: AdminApiBody | undefined, headers: Headers) {
  if (body == null) {
    return undefined;
  }

  if (isNativeBody(body)) {
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

function isNativeBody(body: AdminApiBody): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream
  );
}

async function readProblemDetail(response: Response) {
  const contentType = response.headers.get("Content-Type");

  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as ProblemDetail;
}
