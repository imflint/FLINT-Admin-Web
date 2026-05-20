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
  AdminDailyUserMetricsRange,
  AdminDailyUserMetricsRes,
  AdminLoginReq,
  AdminLoginRes,
  AdminMeRes,
  AdminProfileUpdateReq,
  AdminRefreshTokenReq,
  AdminUserDetailRes,
  AdminUserModerationReq,
  AdminUserSummaryRes,
  AdminUserStatisticsRes,
  CollectionModerationStatus,
  MediaType,
  PaginationResponse,
  ReportStatus,
  TermsCreateReq,
  TermsListParams,
  TermsRes,
  UserStatus
} from "./adminTypes";

export const adminQueryKeys = {
  me: ["admin", "me"] as const,
  userStatistics: ["admin", "users", "statistics"] as const,
  users: (params: AdminUserListParams) => ["admin", "users", params] as const,
  user: (userId: number) => ["admin", "users", userId] as const,
  dailyUserMetrics: (params: AdminDailyUserMetricsParams) => ["admin", "users", "daily-activity", params] as const,
  contents: (params: AdminContentListParams) => ["admin", "contents", params] as const,
  collections: (params: AdminCollectionListParams) => ["admin", "collections", params] as const,
  collection: (collectionId: number) => ["admin", "collections", collectionId] as const,
  collectionReports: (params: CollectionReportsParams) => ["admin", "reports", "collections", params] as const,
  collectionReport: (reportId: number) => ["admin", "reports", "collections", reportId] as const,
  terms: (params: TermsListParams) => ["admin", "terms", params] as const
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

export interface AdminUserListParams {
  keyword?: string;
  status?: UserStatus;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
}

export interface CollectionReportsParams {
  status?: ReportStatus;
  page?: number;
  size?: number;
}

export interface AdminDailyUserMetricsParams {
  range?: AdminDailyUserMetricsRange;
  from?: string;
  to?: string;
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

export function getAdminUsers(params: AdminUserListParams = {}) {
  return adminApi<PaginationResponse<AdminUserSummaryRes>>(withQuery("/admin/users", params));
}

export function getAdminUser(userId: number) {
  return adminApi<AdminUserDetailRes>(`/admin/users/${userId}`);
}

export function moderateAdminUser(userId: number, request: AdminUserModerationReq) {
  return adminApi<AdminUserDetailRes>(`/admin/users/${userId}/moderations`, {
    method: "POST",
    body: request
  });
}

export function getAdminDailyUserMetrics(params: AdminDailyUserMetricsParams = {}) {
  return adminApi<AdminDailyUserMetricsRes>(withQuery("/admin/users/daily-activity", params));
}

export function getAdminMe() {
  return adminApi<AdminMeRes>("/admin/me");
}

export function updateAdminMe(request: AdminProfileUpdateReq) {
  return adminApi<AdminMeRes>("/admin/me", {
    method: "PATCH",
    body: request
  });
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

export function getTerms(params: TermsListParams = {}) {
  return adminApi<TermsRes[]>(withQuery("/admin/terms", params));
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
