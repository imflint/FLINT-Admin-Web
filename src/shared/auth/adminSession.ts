import { useSyncExternalStore } from "react";

import { refreshAdminTokens } from "../api/adminEndpoints";
import { clearAdminAccessToken, setAdminAccessToken, setAdminUnauthorizedHandler } from "../api/adminApi";
import type { AdminLoginRes } from "../api/adminTypes";

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  adminId: number;
}

export const ADMIN_SESSION_STORAGE_KEY = "flint.admin.session";

const listeners = new Set<() => void>();

let currentSession = readStoredSession();
let refreshPromise: Promise<boolean> | null = null;

setAdminAccessToken(currentSession?.accessToken ?? null);
setAdminUnauthorizedHandler(refreshAdminSession);

export function saveAdminSession(loginResponse: AdminLoginRes) {
  currentSession = {
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
    adminId: loginResponse.adminId
  };

  writeStoredSession(currentSession);
  setAdminAccessToken(currentSession.accessToken);
  notifySessionChange();
}

export function clearAdminSession() {
  currentSession = null;
  removeStoredSession();
  clearAdminAccessToken();
  notifySessionChange();
}

export function getAdminSession() {
  return currentSession;
}

export async function refreshAdminSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = currentSession?.refreshToken;

  if (!refreshToken) {
    clearAdminSession();
    return false;
  }

  refreshPromise = refreshAdminTokens({ refreshToken })
    .then((tokens) => {
      saveAdminSession(tokens);
      return true;
    })
    .catch(() => {
      clearAdminSession();
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function useAdminSession() {
  return useSyncExternalStore(subscribeAdminSession, getAdminSession, () => null);
}

function subscribeAdminSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifySessionChange() {
  listeners.forEach((listener) => listener());
}

function readStoredSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<AdminSession>;

    if (
      typeof parsedSession.accessToken === "string" &&
      typeof parsedSession.refreshToken === "string" &&
      typeof parsedSession.adminId === "number"
    ) {
      return {
        accessToken: parsedSession.accessToken,
        refreshToken: parsedSession.refreshToken,
        adminId: parsedSession.adminId
      };
    }
  } catch {
    removeStoredSession();
  }

  return null;
}

function writeStoredSession(session: AdminSession) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

function removeStoredSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  }
}
