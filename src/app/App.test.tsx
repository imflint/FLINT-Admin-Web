import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { AppProviders } from "./providers";
import { adminApi } from "../shared/api/adminApi";
import type { AdminUserStatisticsRes } from "../shared/api/adminTypes";
import { clearAdminSession, saveAdminSession } from "../shared/auth/adminSession";

vi.mock("@ant-design/charts", () => ({
  Line: () => <div role="img" aria-label="사용자 지표 그래프" />
}));

function renderRoute(path: string) {
  window.history.pushState({}, "", path);

  return render(
    <AppProviders>
      <App />
    </AppProviders>
  );
}

afterEach(() => {
  cleanup();
  clearAdminSession();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("App routes", () => {
  it("인증된 사용자는 /admin에서 대시보드로 이동한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin");

    expect(await screen.findByRole("heading", { name: "대시보드" })).toBeInTheDocument();
    expect(await screen.findByText("일별 사용자 지표")).toBeInTheDocument();
    expect(screen.getAllByText("방문자").length).toBeGreaterThan(0);
    expect(screen.getByText("신규 가입")).toBeInTheDocument();
    expect(screen.getByText("회원 수")).toBeInTheDocument();
    expect(screen.getByText("7일")).toBeInTheDocument();
    expect(screen.getByText("30일")).toBeInTheDocument();
    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.queryByText("바로 할 수 있는 작업")).not.toBeInTheDocument();
  });

  it("인증되지 않은 사용자는 관리자 화면에서 로그인으로 이동한다", async () => {
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("heading", { name: "관리자 로그인" })).toBeInTheDocument();
  });

  it("신고 관리 화면에 실제 신고 목록을 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("heading", { name: "신고 관리" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "추천 컬렉션" })).toBeInTheDocument();
  });

  it("회원 관리 화면에 실제 회원 목록을 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/users");

    expect(await screen.findByRole("heading", { name: "회원 관리" })).toBeInTheDocument();
    expect(await screen.findByText("플린트")).toBeInTheDocument();
  });

  it("컬렉션 관리 화면에 실제 컬렉션 목록을 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/collections");

    expect(await screen.findByRole("heading", { name: "Collections" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "추천 컬렉션" })).toBeInTheDocument();
  });

  it("계정 설정 화면에 관리자 본인 정보를 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/account");

    expect(await screen.findByRole("heading", { name: "계정 설정" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue("admin")).toBeInTheDocument();
  });

  it("약관 관리 화면에 약관 목록을 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/terms");

    expect(await screen.findByRole("heading", { name: "약관 관리" })).toBeInTheDocument();
    expect(await screen.findByText("서비스 이용약관 v1")).toBeInTheDocument();
    expect(screen.queryByText("서비스 이용약관 본문입니다.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "본문 보기" }));

    expect(await screen.findByText("서비스 이용약관 본문입니다.")).toBeInTheDocument();
  });

  it("로그인에 성공하면 원래 요청한 관리자 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    mockAdminFetch();
    renderRoute("/login");

    expect(await screen.findByRole("heading", { name: "관리자 로그인" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("아이디"), "admin");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("heading", { name: "대시보드" })).toBeInTheDocument();
  });

  it("Access Token이 만료되면 Refresh Token으로 갱신한 뒤 요청을 재시도한다", async () => {
    signInTestSession();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/admin/auth/refresh")) {
        return jsonResponse({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          adminId: 1
        });
      }

      if (url.includes("/admin/users/statistics") && fetchMock.mock.calls.length === 1) {
        return problemResponse(401);
      }

      return jsonResponse({ activeUserCount: 456 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await adminApi<AdminUserStatisticsRes>("/admin/users/statistics");

    expect(result.activeUserCount).toBe(456);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

function signInTestSession() {
  saveAdminSession({
    accessToken: "test-access-token",
    refreshToken: "ignored",
    adminId: 1
  });
}

function mockAdminFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/admin/auth/login")) {
        return jsonResponse({
          accessToken: "test-access-token",
          refreshToken: "ignored",
          adminId: 1
        });
      }

      if (url.includes("/admin/users/statistics")) {
        return jsonResponse({ activeUserCount: 123 });
      }

      if (url.includes("/admin/users/daily-activity")) {
        return jsonResponse({
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
      }

      if (url.includes("/admin/users/10/moderations")) {
        return jsonResponse(adminUserDetail);
      }

      if (url.includes("/admin/users/10")) {
        return jsonResponse(adminUserDetail);
      }

      if (url.includes("/admin/users?") || url.endsWith("/admin/users")) {
        return jsonResponse({
          data: [adminUserSummary],
          meta: {
            type: "OFFSET",
            returned: 1,
            page: 1,
            size: 10,
            totalElements: 1,
            totalPages: 1
          }
        });
      }

      if (url.includes("/admin/me")) {
        return jsonResponse({
          adminId: 1,
          username: "admin",
          passwordChangedAt: "2026-05-18T10:00:00",
          createdAt: "2026-05-18T10:00:00",
          updatedAt: "2026-05-18T10:00:00"
        });
      }

      if (url.includes("/admin/reports/collections")) {
        return jsonResponse({
          data: [
            {
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
            }
          ],
          meta: {
            type: "OFFSET",
            returned: 1,
            page: 1,
            size: 10,
            totalElements: 1,
            totalPages: 1
          }
        });
      }

      if (url.includes("/admin/collections")) {
        return jsonResponse({
          data: [
            {
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
            }
          ],
          meta: {
            type: "OFFSET",
            returned: 1,
            page: 1,
            size: 10,
            totalElements: 1,
            totalPages: 1
          }
        });
      }

      if (url.includes("/admin/terms")) {
        return jsonResponse([
          {
            id: 1,
            type: "SERVICE",
            context: "SIGNUP",
            version: 1,
            title: "서비스 이용약관 v1",
            content: "서비스 이용약관 본문입니다.",
            required: true,
            activeAt: "2026-05-01T00:00:00"
          }
        ]);
      }

      return jsonResponse({});
    })
  );
}

const adminUserSummary = {
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

const adminUserDetail = {
  ...adminUserSummary,
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

function jsonResponse<T>(data: T) {
  return new Response(
    JSON.stringify({
      status: 200,
      message: "OK",
      data
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

function problemResponse(status: number) {
  return new Response(
    JSON.stringify({
      status,
      code: "AUTH.EXPIRED_TOKEN",
      message: "만료된 토큰입니다."
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
