import type {
  CollectionModerationAction,
  CollectionModerationStatus,
  ReportReason,
  ReportStatus,
  TermsContext,
  TermsType,
  UserModerationAction,
  UserRole,
  UserStatus
} from "./adminTypes";

export const reportStatusLabels: Record<ReportStatus, string> = {
  PENDING: "처리 대기",
  RESOLVED: "처리 완료"
};

export const reportReasonLabels: Record<ReportReason, string> = {
  ABUSE: "욕설·혐오",
  OBSCENE: "음란·선정",
  SPAM: "광고·스팸",
  COPYRIGHT: "저작권 침해",
  OTHER: "기타"
};

export const collectionActionLabels: Record<CollectionModerationAction, string> = {
  DELETE: "삭제",
  HIDE: "숨김",
  KEEP: "유지"
};

export const collectionStatusLabels: Record<CollectionModerationStatus, string> = {
  VISIBLE: "정상",
  HIDDEN: "숨김",
  DELETED: "삭제됨"
};

export const userActionLabels: Record<UserModerationAction, string> = {
  WARN: "경고",
  RESTRICT_UPLOAD: "업로드 제한",
  SUSPEND: "계정 정지",
  KEEP: "조치 없음"
};

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "정상",
  WITHDRAWN: "탈퇴"
};

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "관리자",
  FLINER: "일반 회원",
  FLING: "게스트"
};

export const termsTypeLabels: Record<TermsType, string> = {
  SERVICE: "서비스 이용약관",
  PRIVACY: "개인정보 처리방침",
  MARKETING: "마케팅 정보 수신",
  WITHDRAWAL: "회원탈퇴 약관"
};

export const termsContextLabels: Record<TermsContext, string> = {
  SIGNUP: "회원가입",
  WITHDRAWAL: "회원탈퇴"
};
