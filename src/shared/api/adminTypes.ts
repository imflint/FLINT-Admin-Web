export type ReportStatus = "PENDING" | "RESOLVED";
export type ReportReason = "ABUSE" | "OBSCENE" | "SPAM" | "COPYRIGHT" | "OTHER";
export type CollectionModerationAction = "DELETE" | "HIDE" | "KEEP";
export type UserModerationAction = "WARN" | "RESTRICT_UPLOAD" | "SUSPEND" | "KEEP";
export type MediaType = "MOVIE" | "TV";
export type TermsType = "SERVICE" | "PRIVACY" | "MARKETING" | "WITHDRAWAL";
export type TermsContext = "SIGNUP" | "WITHDRAWAL";

export interface PaginationResponse<T> {
  data: T[];
  meta: {
    type: "CURSOR";
    returned: number;
    nextCursor?: string | null;
  };
}

export interface AdminLoginReq {
  username: string;
  password: string;
}

export interface AdminRefreshTokenReq {
  refreshToken: string;
}

export interface AdminLoginRes {
  accessToken: string;
  refreshToken: string;
  adminId: number;
}

export interface AdminUserStatisticsRes {
  activeUserCount: number;
}

export interface AdminCollectionReportSummaryRes {
  reportId: number;
  collectionId: number;
  collectionTitle: string;
  collectionImageUrl?: string | null;
  reporterId: number;
  reporterNickname: string;
  ownerId: number;
  ownerNickname: string;
  reasons: ReportReason[];
  otherDetail?: string | null;
  reportStatus: ReportStatus;
  createdAt: string;
  processedAt?: string | null;
}

export interface AdminCollectionReportDetailRes {
  report: {
    reportId: number;
    reasons: ReportReason[];
    otherDetail?: string | null;
    reportStatus: ReportStatus;
    collectionAction?: CollectionModerationAction | null;
    userAction?: UserModerationAction | null;
    userActionExpiresAt?: string | null;
    adminId?: number | null;
    adminMemo?: string | null;
    createdAt: string;
    processedAt?: string | null;
  };
  collection: {
    collectionId: number;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    isPublic?: boolean;
    public?: boolean;
    moderationStatus: string;
    bookmarkCount: number;
    createdAt: string;
  };
  reporter: AdminReportUserInfo;
  owner: AdminReportUserInfo;
  contents: AdminReportContentInfo[];
}

export interface AdminReportUserInfo {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
}

export interface AdminReportContentInfo {
  contentId: number;
  title: string;
  posterUrl?: string | null;
  customImageUrl?: string | null;
  reason?: string | null;
  isSpoiler: boolean;
}

export interface AdminCollectionReportResolutionReq {
  collectionAction: CollectionModerationAction;
  userAction: UserModerationAction;
  userActionExpiresAt?: string | null;
  adminMemo?: string;
}

export interface AdminContentUpdateReq {
  title?: string;
  year?: number;
  author?: string;
  description?: string;
  poster?: string;
  genreNames?: string[];
}

export interface AdminContentRes {
  id: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number;
  author: string;
  description: string;
  posterUrl?: string | null;
  bookmarkCount: number;
  genreNames: string[];
}

export interface TermsCreateReq {
  type: TermsType;
  context?: TermsContext;
  version: number;
  title: string;
  content: string;
  required: boolean;
  activeAt: string;
}

export interface TermsRes {
  id: number;
  type: TermsType;
  context: TermsContext;
  version: number;
  title: string;
  content: string;
  required: boolean;
  activeAt: string;
}

export type BatchType = "movies" | "tv" | "ott" | "delta";

export interface BatchTriggerReq {
  type: BatchType;
  date?: string;
  mediaType?: MediaType;
  startDate?: string;
  endDate?: string;
}

export interface BatchJobExecutionRes {
  jobName: string;
  executionId: number;
  status: string;
  createTime: string;
}
