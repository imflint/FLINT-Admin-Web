import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

test("renders login route", async ({ page }) => {
  await mockAdminApi(page);
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});

test("logs in and renders overview route", async ({ page }) => {
  await mockAdminApi(page);
  await page.goto("/login");

  await page.getByLabel("아이디").fill("admin");
  await page.getByLabel("비밀번호").fill("password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expect(page.getByText("가입 회원 수")).toBeVisible();
  await expect(page.getByText("일별 사용자 지표")).toBeVisible();
  await expect(page.getByRole("heading", { name: "방문자" })).toBeVisible();
  await expect(page.locator(".ant-segmented-item-label", { hasText: "신규 가입" })).toBeVisible();
  await expect(page.locator(".ant-segmented-item-label", { hasText: "회원 수" })).toBeVisible();
  await expect(page.getByText("7일")).toBeVisible();
  await expect(page.getByText("30일")).toBeVisible();
  await expect(page.getByText("전체")).toBeVisible();
});

test("renders main admin routes", async ({ page }) => {
  await mockAdminApi(page);
  await seedAdminSession(page);

  await page.goto("/admin/overview");

  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "회원 관리" })).toBeVisible();
  await expect(page.getByText("플린트")).toBeVisible();
  await page.goto("/admin/content");
  await expect(page.getByRole("heading", { name: "Contents" })).toBeVisible();
  await page.goto("/admin/collections");
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
  await page.goto("/admin/terms");
  await expect(page.getByRole("heading", { name: "약관 관리" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "서비스 이용약관 v1" })).toBeVisible();
  await expect(page.getByText("서비스 이용약관 본문입니다.")).toBeHidden();
  await page.getByRole("button", { name: "본문 보기" }).click();
  await expect(page.getByText("서비스 이용약관 본문입니다.")).toBeVisible();
  await page.goto("/admin/account");
  await expect(page.getByRole("heading", { name: "계정 설정" })).toBeVisible();
});

test("opens moderation detail and resolves a report", async ({ page }) => {
  let resolutionRequested = false;
  await mockAdminApi(page, {
    onResolution: () => {
      resolutionRequested = true;
    }
  });
  await seedAdminSession(page);
  await page.goto("/admin/moderation");

  await expect(page.getByRole("heading", { name: "신고 관리" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "추천 컬렉션", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "검토하기" }).click();
  await expect(page.getByText("신고 검토")).toBeVisible();
  await page.getByLabel("관리자 메모").fill("스팸 신고 확인");
  await page.getByRole("button", { name: "처리 완료" }).click();

  await expect.poll(() => resolutionRequested).toBe(true);
});

test("opens user detail and applies a user moderation", async ({ page }) => {
  let userModerationRequested = false;
  await mockAdminApi(page, {
    onUserModeration: () => {
      userModerationRequested = true;
    }
  });
  await seedAdminSession(page);
  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "회원 관리" })).toBeVisible();
  await expect(page.getByText("플린트")).toBeVisible();

  await page.getByRole("button", { name: "상세 보기" }).click();
  await expect(page.getByText("회원 상세")).toBeVisible();
  await page.getByLabel("관리자 메모").fill("운영 확인");
  await page.getByRole("button", { name: "저장" }).click();

  await expect.poll(() => userModerationRequested).toBe(true);
});

test("submits content and terms mutations", async ({ page }) => {
  await mockAdminApi(page);
  await seedAdminSession(page);

  await page.goto("/admin/content");
  await expect(page.getByRole("cell", { name: "인셉션" })).toBeVisible();
  await page.getByRole("row", { name: /인셉션/ }).getByRole("button", { name: "수정하기" }).click();
  await page.getByLabel("제목").fill("인셉션");
  await page.getByLabel("컨텐츠 정보 수정").getByRole("button", { name: "수정하기" }).click();
  await expect(page.getByText("크리스토퍼 놀란")).toBeVisible();

  await page.goto("/admin/collections");
  await expect(page.getByRole("cell", { name: "추천 컬렉션" })).toBeVisible();
  await page.getByRole("row", { name: /추천 컬렉션/ }).getByRole("button", { name: "수정하기" }).click();
  await expect(page.getByText("컬렉션 정보 수정")).toBeVisible();
  await page.getByLabel("제목").fill("추천 컬렉션 수정");
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("컬렉션 정보를 수정했습니다.")).toBeVisible();

  await page.goto("/admin/terms");
  await expect(page.getByRole("cell", { name: "서비스 이용약관 v1" })).toBeVisible();
  await page.getByLabel("버전").fill("1");
  await page.getByLabel("제목").fill("서비스 이용약관");
  await page.getByLabel("본문").fill("본문");
  await page.getByLabel("적용 시작 시각").fill("2026-05-01 00:00:00");
  await page.getByLabel("적용 시작 시각").press("Enter");
  await page.getByRole("button", { name: "약관 생성" }).click();
  await expect(page.getByText("약관을 생성했습니다.").first()).toBeVisible();
});

test("updates admin account and redirects to login", async ({ page }) => {
  await mockAdminApi(page);
  await seedAdminSession(page);
  await page.goto("/admin/account");

  await expect(page.getByRole("heading", { name: "계정 설정" })).toBeVisible();
  await page.getByLabel("아이디").fill("operator");
  await page.getByLabel("현재 비밀번호").fill("current-password");
  await page.getByLabel("새 비밀번호", { exact: true }).fill("new-password");
  await page.getByLabel("새 비밀번호 확인").fill("new-password");
  await page.getByRole("button", { name: "저장하기" }).click();

  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});

async function seedAdminSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "flint.admin.session",
      JSON.stringify({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        adminId: 1
      })
    );
  });
}

async function mockAdminApi(
  page: Page,
  options: { onResolution?: () => void; onUserModeration?: () => void } = {}
) {
  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (method === "POST" && pathname.endsWith("/admin/auth/login")) {
      await fulfillSuccess(route, {
        accessToken: "test-access-token",
        refreshToken: "ignored",
        adminId: 1
      });
      return;
    }

    if (method === "POST" && pathname.endsWith("/admin/auth/refresh")) {
      await fulfillSuccess(route, {
        accessToken: "new-test-access-token",
        refreshToken: "new-test-refresh-token",
        adminId: 1
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/users/statistics")) {
      await fulfillSuccess(route, { activeUserCount: 123 });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/users/daily-activity")) {
      await fulfillSuccess(route, {
        dailyMetrics: [
          {
            date: "2026-05-16",
            visitorCount: 10,
            signupUserCount: 2,
            memberCount: 100
          },
          {
            date: "2026-05-17",
            visitorCount: 12,
            signupUserCount: 3,
            memberCount: 103
          }
        ]
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/users")) {
      await fulfillSuccess(route, {
        data: [userSummary],
        meta: {
          type: "OFFSET",
          returned: 1,
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/users/10")) {
      await fulfillSuccess(route, userDetail);
      return;
    }

    if (method === "POST" && pathname.endsWith("/admin/users/10/moderations")) {
      options.onUserModeration?.();
      await fulfillSuccess(route, {
        ...userDetail,
        warningCount: 2,
        recentModerations: [
          {
            historyId: 2,
            adminId: 1,
            action: "WARN",
            actionExpiresAt: null,
            adminMemo: "운영 확인",
            createdAt: "2026-05-20T10:00:00"
          },
          ...userDetail.recentModerations
        ]
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/me")) {
      await fulfillSuccess(route, adminMe);
      return;
    }

    if (method === "PATCH" && pathname.endsWith("/admin/me")) {
      await fulfillSuccess(route, {
        ...adminMe,
        username: "operator",
        passwordChangedAt: "2026-05-18T11:00:00",
        updatedAt: "2026-05-18T11:00:00"
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/contents")) {
      await fulfillSuccess(route, {
        data: [contentSummary],
        meta: {
          type: "CURSOR",
          returned: 1,
          nextCursor: null
        }
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/collections")) {
      await fulfillSuccess(route, {
        data: [collectionSummary],
        meta: {
          type: "OFFSET",
          returned: 1,
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/collections/20")) {
      await fulfillSuccess(route, collectionDetail);
      return;
    }

    if (method === "PUT" && pathname.endsWith("/admin/collections/20")) {
      await fulfillSuccess(route, {
        ...collectionDetail,
        title: "추천 컬렉션 수정"
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/reports/collections")) {
      await fulfillSuccess(route, {
        data: [reportSummary],
        meta: {
          type: "OFFSET",
          returned: 1,
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1
        }
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/reports/collections/10")) {
      await fulfillSuccess(route, reportDetail);
      return;
    }

    if (method === "PATCH" && pathname.endsWith("/admin/reports/collections/10/resolution")) {
      options.onResolution?.();
      await fulfillSuccess(route, null);
      return;
    }

    if (method === "PATCH" && pathname.endsWith("/admin/contents/1")) {
      await fulfillSuccess(route, {
        id: 1,
        tmdbId: 100,
        mediaType: "MOVIE",
        title: "인셉션",
        year: 2010,
        author: "크리스토퍼 놀란",
        description: "꿈을 다루는 영화",
        posterUrl: null,
        bookmarkCount: 5,
        genreNames: ["SF"]
      });
      return;
    }

    if (method === "GET" && pathname.endsWith("/admin/terms")) {
      await fulfillSuccess(route, [termsSummary]);
      return;
    }

    if (method === "POST" && pathname.endsWith("/admin/terms")) {
      await fulfillSuccess(route, termsSummary);
      return;
    }

    await route.fulfill({ status: 404, body: "Not mocked" });
  });
}

async function fulfillSuccess(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      status: 200,
      message: "OK",
      data
    })
  });
}

const reportSummary = {
  reportId: 10,
  collectionId: 20,
  collectionTitle: "추천 컬렉션",
  collectionImageUrl: null,
  reporterId: 30,
  reporterNickname: "신고자",
  ownerId: 40,
  ownerNickname: "소유자",
  reasons: ["SPAM"],
  otherDetail: null,
  reportStatus: "PENDING",
  createdAt: "2026-05-17T10:00:00",
  processedAt: null
};

const contentSummary = {
  id: 1,
  tmdbId: 100,
  mediaType: "MOVIE",
  title: "인셉션",
  year: 2010,
  author: "크리스토퍼 놀란",
  description: "꿈을 다루는 영화",
  posterUrl: null,
  bookmarkCount: 5,
  genreNames: ["SF"]
};

const collectionSummary = {
  collectionId: 20,
  title: "추천 컬렉션",
  description: "설명",
  imageUrl: null,
  isPublic: true,
  moderationStatus: "VISIBLE",
  bookmarkCount: 1,
  ownerId: 40,
  ownerNickname: "소유자",
  contentCount: 1,
  createdAt: "2026-05-17T09:00:00"
};

const adminMe = {
  adminId: 1,
  username: "admin",
  passwordChangedAt: "2026-05-18T10:00:00",
  createdAt: "2026-05-18T10:00:00",
  updatedAt: "2026-05-18T10:00:00"
};

const termsSummary = {
  id: 1,
  type: "SERVICE",
  context: "SIGNUP",
  version: 1,
  title: "서비스 이용약관 v1",
  content: "서비스 이용약관 본문입니다.",
  required: true,
  activeAt: "2026-05-01T00:00:00"
};

const userSummary = {
  userId: 10,
  nickname: "플린트",
  profileImageUrl: null,
  userRole: "FLINER",
  status: "ACTIVE",
  warningCount: 1,
  uploadRestricted: false,
  uploadRestrictedUntil: null,
  suspended: false,
  suspendedUntil: null,
  createdAt: "2026-05-01T09:00:00"
};

const userDetail = {
  ...userSummary,
  uploadRestrictedAt: null,
  suspendedAt: null,
  deletedAt: null,
  updatedAt: "2026-05-02T09:00:00",
  recentModerations: [
    {
      historyId: 1,
      adminId: 1,
      action: "WARN",
      actionExpiresAt: null,
      adminMemo: "메모",
      createdAt: "2026-05-02T10:00:00"
    }
  ]
};

const reportDetail = {
  report: {
    reportId: 10,
    reasons: ["SPAM"],
    otherDetail: null,
    reportStatus: "PENDING",
    collectionAction: null,
    userAction: null,
    userActionExpiresAt: null,
    adminId: null,
    adminMemo: null,
    createdAt: "2026-05-17T10:00:00",
    processedAt: null
  },
  collection: {
    collectionId: 20,
    title: "추천 컬렉션",
    description: "설명",
    imageUrl: null,
    isPublic: true,
    moderationStatus: "NORMAL",
    bookmarkCount: 1,
    createdAt: "2026-05-17T09:00:00"
  },
  reporter: {
    userId: 30,
    nickname: "신고자",
    profileImageUrl: null
  },
  owner: {
    userId: 40,
    nickname: "소유자",
    profileImageUrl: null
  },
  contents: [
    {
      contentId: 1,
      title: "인셉션",
      posterUrl: null,
      customImageUrl: null,
      reason: "스팸성 설명",
      isSpoiler: false
    }
  ]
};

const collectionDetail = {
  collectionId: 20,
  title: "추천 컬렉션",
  description: "설명",
  imageUrl: null,
  isPublic: true,
  moderationStatus: "VISIBLE",
  bookmarkCount: 1,
  createdAt: "2026-05-17T09:00:00",
  owner: {
    userId: 40,
    nickname: "소유자",
    profileImageUrl: null
  },
  contents: [
    {
      contentId: 1,
      title: "인셉션",
      posterUrl: null,
      customImageUrl: null,
      isSpoiler: false,
      reason: "좋아요",
      year: 2010,
      mediaType: "MOVIE"
    }
  ]
};
