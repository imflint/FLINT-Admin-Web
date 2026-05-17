import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { AppProviders } from "./providers";
import { adminApi } from "../shared/api/adminApi";
import type { AdminUserStatisticsRes } from "../shared/api/adminTypes";
import { clearAdminSession, saveAdminSession } from "../shared/auth/adminSession";

function renderRoute(path: string) {
  window.history.pushState({}, "", path);

  return render(
    <AppProviders>
      <App />
    </AppProviders>
  );
}

afterEach(() => {
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

  it("컬렉션 관리 화면에 실제 컬렉션 목록을 표시한다", async () => {
    mockAdminFetch();
    signInTestSession();
    renderRoute("/admin/collections");

    expect(await screen.findByRole("heading", { name: "컬렉션" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "추천 컬렉션" })).toBeInTheDocument();
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

      return jsonResponse({});
    })
  );
}

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
