# Flint Admin Frontend Implementation Guidelines

이 문서는 `index.html` 프로토타입을 실제 프론트엔드가 구현할 수 있도록 정리한 가이드입니다. 목표는 마케팅 페이지가 아니라 Flint 운영자가 매일 쓰는 관리자 콘솔입니다.

## 1. 구현 목표

- Flint의 사용자, 콘텐츠, 컬렉션, 북마크, 취향 프로필, 검색 품질, 모더레이션, 감사 로그를 한 작업 공간에서 관리한다.
- 운영자가 빠르게 스캔하고 조치할 수 있도록 테이블, 필터, 상태 배지, bulk action, detail drawer를 중심으로 구성한다.
- 모든 숫자와 레코드는 실제 데이터 연결 전까지 `sample` 또는 `placeholder`임을 UI와 코드 레벨에서 명확히 표시한다.
- 위험한 운영 액션은 role-aware control로 처리하고, 감사 로그에 남길 수 없는 액션은 실행하지 않는다.

## 2. 화면 구성

프로토타입의 5개 화면을 그대로 1차 구현 범위로 잡는다.

| Route | 목적 | 핵심 UI |
| --- | --- | --- |
| `/admin/overview` | 운영 현황 요약과 우선순위 큐 | KPI cards, priority table, search quality snapshot |
| `/admin/users` | 사용자, 북마크, 취향 프로필 관리 | user table, account state filters, bulk actions |
| `/admin/content` | 콘텐츠, 컬렉션, 북마크 관리 | content cards, inventory table, re-index/merge actions |
| `/admin/moderation` | 정책/신고/이의제기 큐 처리 | moderation table, evidence preview, decision checklist |
| `/admin/analytics` | 운영 지표와 감사 로그 조회 | metrics, workflow volume chart, audit stream |

상세 정보는 별도 페이지로 먼저 분리하지 말고, 우측 `DetailDrawer`를 기본 패턴으로 사용한다. URL deep-link가 필요하면 `?recordId=CQ-1842`처럼 drawer 상태를 쿼리 파라미터에 보존한다.

## 3. 레이아웃 원칙

- Desktop-first admin UI로 구현한다. 권장 최소 폭은 1180px이다.
- 기본 구조는 `Sidebar + Workspace + DetailDrawer` 3영역이다.
- 1260px 이하에서는 drawer를 닫힌 상태의 modal/drawer overlay로 전환한다.
- 상단에는 현재 화면 제목, 설명, workspace search, export/create action을 둔다.
- 각 화면 첫 줄에는 filter toolbar를 둔다. 필터는 항상 검색어, 상태, 담당 팀 또는 기간을 포함한다.
- 콘텐츠보다 장식이 앞서면 실패다. hero, 마케팅 이미지, 과한 gradient, 큰 일러스트는 사용하지 않는다.

## 4. 디자인 토큰

현재 프로토타입과 active Ant admin system을 기준으로 한다.

```ts
export const flintAdminTokens = {
  colorPrimary: "#1677FF",
  colorSecondary: "#8B5CF6",
  colorSuccess: "#16A34A",
  colorWarning: "#D97706",
  colorDanger: "#DC2626",
  colorBgContainer: "#FFFFFF",
  colorText: "#111827",
  borderRadius: 8,
  fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif",
  fontFamilyMono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
};
```

실제 Ant Design React를 쓴다면 `ConfigProvider`의 theme token으로 위 값을 주입한다. Table, Drawer, Form, Tag는 라이브러리 기본 패턴을 우선 사용하고, CSS override는 레이아웃 밀도와 토큰 보정에 한정한다.

Ant Design 구현 메모:

- `Table`은 `rowSelection`, 서버 pagination, sorter/filter state를 route query와 연결한다.
- `Drawer`는 `open` 상태로 제어하고 detail action은 `footer` 또는 별도 footer 영역에 둔다.
- Drawer 내부 스타일 조정은 deprecated style prop보다 semantic `styles` 계열을 우선 검토한다.
- `Tag`는 색상 의미를 통일한 `StatusBadge` wrapper로 감싸서 화면마다 label/color가 달라지지 않게 한다.
- compact density가 필요해도 hit target과 focus-visible 상태는 줄이지 않는다.

## 5. 컴포넌트 분리

다음 단위로 먼저 나누면 구현과 테스트가 안정적이다.

| Component | 책임 |
| --- | --- |
| `AdminShell` | sidebar, topbar, workspace, drawer layout 조립 |
| `SidebarNav` | route navigation, queue counts, active state |
| `WorkspaceHeader` | 화면 제목, 설명, global search, primary actions |
| `SampleDataBanner` | sample/placeholder 데이터 경고 표시 |
| `FilterToolbar` | 화면별 검색/필터 Form 렌더링 |
| `MetricCard` | 운영 KPI 표시, delta 상태 표시 |
| `StatusBadge` | account/content/moderation/search 상태 표준화 |
| `DataTable` | row selection, sorting, pagination, row click |
| `ContentPreviewCard` | 콘텐츠/컬렉션/북마크 card preview |
| `DetailDrawer` | 선택 레코드 상세, workflow actions, audit trail |
| `AuditTimeline` | 시간순 감사 이벤트 표시 |
| `BulkActionBar` | 선택된 row 대상 role-aware actions |

단순 getter성 helper를 늘리지 말고, 컴포넌트와 domain service가 실제 행동을 표현하게 한다. 예: `canEscalateCase(operator, case)`는 가능하지만 `getOperatorRole()`만 노출하는 식의 얇은 getter는 피한다.

## 6. 권장 도메인 모델

타입은 화면 단위가 아니라 Flint 운영 도메인 기준으로 분리한다.

```ts
type ReviewState =
  | "healthy"
  | "monitor"
  | "needs_review"
  | "escalated"
  | "restricted"
  | "removed"
  | "ready";

type RiskLevel = "low" | "medium" | "high";

interface AdminActor {
  id: string;
  displayName: string;
  role: "ops_lead" | "support" | "trust_safety" | "search_relevance" | "read_only";
}

interface FlintUser {
  id: string;
  label: string;
  accountState: ReviewState;
  bookmarkCount: number;
  collectionCount: number;
  tasteProfileState: "fresh" | "stale" | "noisy" | "frozen";
  lastActionAt: string;
}

interface ContentRecord {
  id: string;
  kind: "content" | "collection" | "bookmark";
  title: string;
  sourceState: string;
  indexState: "indexed" | "partial" | "failed";
  policyState: ReviewState;
  bookmarkCount: number;
  collectionCount: number;
}

interface ModerationCase {
  id: string;
  subjectId: string;
  subjectKind: "user" | "content" | "collection" | "bookmark";
  evidenceSummary: string;
  risk: RiskLevel;
  state: ReviewState;
  slaDueAt: string;
  assignedTeam: string;
}

interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  targetKind: string;
  reason?: string;
  createdAt: string;
  risk?: RiskLevel;
}
```

## 7. 데이터 계약과 API 기준

- 리스트 API는 서버 페이지네이션을 기본으로 한다: `page`, `pageSize`, `sort`, `filters`, `query`.
- 모든 테이블 row는 안정적인 `id`를 가져야 한다. 표시용 label을 key로 쓰지 않는다.
- 필터 상태는 URL query에 반영한다. 운영자가 새로고침하거나 링크를 공유해도 같은 결과가 보여야 한다.
- bulk action API는 `targetIds`, `action`, `reason`, `idempotencyKey`를 포함한다.
- 고위험 액션은 서버에서 권한을 재검증한다. 프론트엔드 disable은 보조 장치일 뿐이다.
- sample 데이터는 `isSample: true` 또는 fixture namespace로 분리한다. 실제 API 응답과 섞지 않는다.

## 8. 상호작용 규칙

- 테이블 row 클릭은 drawer open이다. 체크박스 클릭과 row click은 충돌하지 않게 이벤트를 분리한다.
- bulk action은 row가 선택되기 전까지 disabled 상태로 둔다.
- `Esc`는 drawer를 닫고, 닫은 뒤 focus를 원래 row 또는 버튼으로 돌려준다.
- drawer footer에는 primary action 1개, secondary action 1~2개, destructive action은 분리해서 둔다.
- destructive action에는 이유 입력과 confirmation step을 요구한다.
- 필터 Apply 후 결과가 없으면 빈 상태에 "조건을 줄이거나 기간을 넓히라"는 운영자용 문구를 보여준다.

## 9. 상태 배지 기준

상태 색상은 의미가 흔들리면 안 된다.

| 상태 | 색상 | 사용 예 |
| --- | --- | --- |
| 정상/완료 | Success green | Active, Fresh, Indexed, Done |
| 정보/검토 | Primary blue | Review, Monitor, Partial, System |
| 주의 | Warning orange | Needs review, Stale, Medium risk |
| 위험 | Danger red | High risk, Restricted, Escalated |
| 중립 | Gray | Frozen, Low, Locked |

색만으로 의미를 전달하지 말고 항상 텍스트 label을 함께 표시한다.

## 10. 접근성

- 모든 테이블에는 명확한 컬럼 헤더와 row header를 둔다.
- drawer는 `aria-labelledby`, `aria-describedby`를 연결한다.
- 상태 배지는 색상 외 텍스트로 의미를 제공한다.
- form field는 label을 숨기지 않는다. 시각적으로 compact하게 하더라도 접근 가능한 label은 유지한다.
- 키보드만으로 route 전환, 필터 적용, row 선택, drawer 닫기, primary action 실행이 가능해야 한다.
- 숫자 지표는 tabular numerics를 사용해 스캔성을 유지한다.

## 11. 권한과 감사 로그

프론트엔드는 권한을 화면 상태에 반영하되, 최종 판정은 서버에 맡긴다.

| Action | 필요 권한 | 감사 로그 필수 필드 |
| --- | --- | --- |
| 사용자 제한 | `trust_safety` 또는 `ops_lead` | actor, target user, reason, prior state |
| 콘텐츠 제거/복구 | `trust_safety` | actor, content id, policy category, evidence id |
| 컬렉션 export | `support` 이상 | actor, collection id, requester, export reason |
| 검색 품질 rule 변경 | `search_relevance` 또는 `ops_lead` | actor, query cluster, before/after, rollback id |
| taste profile rebuild | `ops_lead` 또는 system job | actor/system, cohort id, rebuild reason |

감사 로그에 남길 수 없는 액션은 UI에서 실행할 수 없어야 한다.

## 12. 테스트 기준

최소 테스트 범위는 다음과 같다.

- 화면 route별 smoke test: overview, users, content, moderation, analytics.
- 필터 상태가 URL query에 보존되는지 확인한다.
- 테이블 row 클릭 시 올바른 drawer record가 열린다.
- bulk action은 선택 row가 없으면 disabled이고, 선택 후 enabled된다.
- destructive action은 reason 없이 제출되지 않는다.
- read-only role은 변경 action을 볼 수 없거나 disabled로 본다.
- audit event 생성 payload에 actor, target, action, reason이 포함된다.
- 키보드 접근: Tab 순서, Enter/Space 실행, Esc drawer close.

## 13. 구현 우선순위

1. `AdminShell`, route, sidebar, topbar를 만든다.
2. shared tokens와 `StatusBadge`, `MetricCard`, `FilterToolbar`를 만든다.
3. 각 route의 table fixture와 drawer 연결을 구현한다.
4. 서버 API 연결 전까지 fixtures를 `sample` namespace로 분리한다.
5. role-aware action state와 audit payload 생성을 붙인다.
6. 실제 API 연결 후 pagination, sorting, filter query를 서버 계약에 맞춘다.
7. 접근성, empty/loading/error state, 권한별 regression test를 추가한다.

## 14. 완료 기준

- 운영자가 5개 화면에서 필요한 레코드를 검색하고 drawer에서 검토할 수 있다.
- 모든 sample metric과 sample record는 실제 데이터처럼 보이지 않게 표시된다.
- 위험 액션은 권한, reason, audit event 없이 실행되지 않는다.
- 테이블과 필터는 dense하지만 13px 이하 본문으로 무리하게 압축하지 않는다.
- 화면은 Flint 운영 워크플로우를 설명하며, 마케팅 페이지처럼 보이지 않는다.
