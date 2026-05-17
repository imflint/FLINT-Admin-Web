import { adminApi } from "./adminApi";
import type {
  AdminCollectionDetailRes,
  AdminCollectionSummaryRes,
  AdminCollectionUpdateReq,
  AdminCollectionVisibility,
  AdminCollectionReportDetailRes,
  AdminCollectionReportResolutionReq,
  AdminCollectionReportSummaryRes,
  AdminContentRes,
  AdminContentUpdateReq,
  AdminLoginReq,
  AdminLoginRes,
  AdminRefreshTokenReq,
  AdminUserStatisticsRes,
  BatchJobExecutionRes,
  BatchTriggerReq,
  CollectionModerationStatus,
  MediaType,
  PaginationResponse,
  ReportStatus,
  TermsCreateReq,
  TermsRes
} from "./adminTypes";

export const adminQueryKeys = {
  userStatistics: ["admin", "users", "statistics"] as const,
  contents: (params: AdminContentListParams) => ["admin", "contents", params] as const,
  collections: (params: AdminCollectionListParams) => ["admin", "collections", params] as const,
  collection: (collectionId: number) => ["admin", "collections", collectionId] as const,
  collectionReports: (params: CollectionReportsParams) => ["admin", "reports", "collections", params] as const,
  collectionReport: (reportId: number) => ["admin", "reports", "collections", reportId] as const
};

export interface AdminContentListParams {
  keyword?: string;
  mediaType?: MediaType;
  cursor?: string | number | null;
  size?: number;
}

export interface AdminCollectionListParams {
  keyword?: string;
  visibility?: AdminCollectionVisibility;
  moderationStatus?: CollectionModerationStatus;
  page?: number;
  size?: number;
}

export interface CollectionReportsParams {
  status?: ReportStatus;
  page?: number;
  size?: number;
}

export function loginAdmin(request: AdminLoginReq) {
  return adminApi<AdminLoginRes>("/admin/auth/login", {
    method: "POST",
    accessToken: null,
    body: request
  });
}

export function refreshAdminTokens(request: AdminRefreshTokenReq) {
  return adminApi<AdminLoginRes>("/admin/auth/refresh", {
    method: "POST",
    accessToken: null,
    skipAuthRefresh: true,
    body: request
  });
}

export function getAdminUserStatistics() {
  return adminApi<AdminUserStatisticsRes>("/admin/users/statistics");
}

export function getAdminContents(params: AdminContentListParams = {}) {
  return adminApi<PaginationResponse<AdminContentRes>>(withQuery("/admin/contents", params));
}

export function getAdminCollections(params: AdminCollectionListParams = {}) {
  return adminApi<PaginationResponse<AdminCollectionSummaryRes>>(withQuery("/admin/collections", params));
}

export function getAdminCollection(collectionId: number) {
  return adminApi<AdminCollectionDetailRes>(`/admin/collections/${collectionId}`);
}

export function updateAdminCollection(collectionId: number, request: AdminCollectionUpdateReq) {
  return adminApi<AdminCollectionDetailRes>(`/admin/collections/${collectionId}`, {
    method: "PUT",
    body: request
  });
}

export function getCollectionReports(params: CollectionReportsParams = {}) {
  return adminApi<PaginationResponse<AdminCollectionReportSummaryRes>>(
    withQuery("/admin/reports/collections", params)
  );
}

export function getCollectionReport(reportId: number) {
  return adminApi<AdminCollectionReportDetailRes>(`/admin/reports/collections/${reportId}`);
}

export function resolveCollectionReport(reportId: number, request: AdminCollectionReportResolutionReq) {
  return adminApi<void>(`/admin/reports/collections/${reportId}/resolution`, {
    method: "PATCH",
    body: request
  });
}

export function updateContent(contentId: number, request: AdminContentUpdateReq) {
  return adminApi<AdminContentRes>(`/admin/contents/${contentId}`, {
    method: "PATCH",
    body: request
  });
}

export function createTerms(request: TermsCreateReq) {
  return adminApi<TermsRes>("/admin/terms", {
    method: "POST",
    body: request
  });
}

export function triggerBatch(request: BatchTriggerReq) {
  const mediaType = request.mediaType ?? "MOVIE";

  if (request.type === "movies") {
    return postBatch("/admin/batch/movies", { date: request.date });
  }

  if (request.type === "tv") {
    return postBatch("/admin/batch/tv", { date: request.date });
  }

  if (request.type === "ott") {
    return postBatch("/admin/batch/ott", { mediaType });
  }

  return postBatch("/admin/batch/delta", {
    mediaType,
    startDate: request.startDate,
    endDate: request.endDate
  });
}

function postBatch(path: string, params: object) {
  return adminApi<BatchJobExecutionRes>(withQuery(path, params), {
    method: "POST",
    rawResponse: true
  });
}

function withQuery(path: string, params: object) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if ((typeof value === "string" && value !== "") || typeof value === "number") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}
