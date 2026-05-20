export type ReportStatus = "PENDING" | "RESOLVED";
export type ReportReason = "ABUSE" | "OBSCENE" | "SPAM" | "COPYRIGHT" | "OTHER";
export type CollectionModerationAction = "DELETE" | "HIDE" | "KEEP";
export type CollectionModerationStatus = "VISIBLE" | "HIDDEN" | "DELETED";
export type AdminCollectionVisibility = "PUBLIC" | "PRIVATE";
export type UserModerationAction = "WARN" | "RESTRICT_UPLOAD" | "SUSPEND" | "KEEP";
export type MediaType = "MOVIE" | "TV";
export type TermsType = "SERVICE" | "PRIVACY" | "MARKETING" | "WITHDRAWAL";
export type TermsContext = "SIGNUP" | "WITHDRAWAL";
export type TermsSortBy = "VERSION" | "TYPE";
export type SortDirection = "ASC" | "DESC";
export type AdminDailyUserMetricsRange = "DAYS_7" | "DAYS_30" | "ALL";
export type UserStatus = "ACTIVE" | "WITHDRAWN";
export type UserRole = "FLINER" | "FLING";

export interface PaginationResponse<T> {
  data: T[];
  meta: {
    type: "CURSOR" | "OFFSET";
    returned: number;
    nextCursor?: string | null;
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
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
  refreshToken?: string | null;
  adminId?: number | null;
}

export interface AdminUserStatisticsRes {
  activeUserCount: number;
}

export interface AdminUserSummaryRes {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  userRole: UserRole;
  status: UserStatus;
  warningCount: number;
  uploadRestricted: boolean;
  uploadRestrictedUntil?: string | null;
  suspended: boolean;
  suspendedUntil?: string | null;
  createdAt: string;
}

export interface AdminUserDetailRes {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  userRole: UserRole;
  status: UserStatus;
  warningCount: number;
  uploadRestricted: boolean;
  uploadRestrictedAt?: string | null;
  uploadRestrictedUntil?: string | null;
  suspended: boolean;
  suspendedAt?: string | null;
  suspendedUntil?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  recentModerations: AdminUserModerationHistoryRes[];
}

export interface AdminUserModerationHistoryRes {
  historyId: number;
  adminId: number;
  action: UserModerationAction;
  actionExpiresAt?: string | null;
  adminMemo?: string | null;
  createdAt?: string | null;
}

export interface AdminUserModerationReq {
  action: Exclude<UserModerationAction, "KEEP">;
  expiresAt?: string | null;
  adminMemo?: string;
}

export interface AdminDailyUserMetricsRes {
  dailyMetrics: AdminDailyUserMetricRes[];
}

export interface AdminDailyUserMetricRes {
  date: string;
  visitorCount: number;
  signupUserCount: number;
  memberCount: number;
}

export interface AdminMeRes {
  adminId: number;
  username: string;
  passwordChangedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminProfileUpdateReq {
  username: string;
  currentPassword: string;
  newPassword?: string;
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

export interface AdminCollectionSummaryRes {
  collectionId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublic: boolean;
  moderationStatus: CollectionModerationStatus;
  bookmarkCount: number;
  ownerId?: number | null;
  ownerNickname?: string | null;
  contentCount: number;
  createdAt: string;
}

export interface AdminCollectionDetailRes {
  collectionId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublic: boolean;
  moderationStatus: CollectionModerationStatus;
  bookmarkCount: number;
  createdAt: string;
  owner: {
    userId?: number | null;
    nickname?: string | null;
    profileImageUrl?: string | null;
  };
  contents: AdminCollectionContentInfo[];
}

export interface AdminCollectionContentInfo {
  contentId: number;
  title: string;
  posterUrl?: string | null;
  customImageUrl?: string | null;
  isSpoiler: boolean;
  reason: string;
  year: number;
  mediaType: MediaType;
}

export interface AdminCollectionUpdateReq {
  imageUrl?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  contentList: AdminCollectionContentUpdateReq[];
}

export interface AdminCollectionContentUpdateReq {
  contentId: number;
  isSpoiler: boolean;
  reason: string;
  customImage?: string;
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

export interface TermsListParams {
  type?: TermsType;
  sortBy?: TermsSortBy;
  direction?: SortDirection;
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
