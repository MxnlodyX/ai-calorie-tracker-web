import { getApiUrl } from "@/lib/api-url";

const REFRESH_SESSION_PATH = "/authentications/refresh";

let pendingRefresh: Promise<boolean> | null = null;

async function performSessionRefresh(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl(REFRESH_SESSION_PATH), {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function refreshSessionOnce(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = performSessionRefresh().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}

export async function runWithSessionRefresh<T>(
  request: () => Promise<T>,
  isUnauthorized: (result: T) => boolean,
): Promise<T> {
  const result = await request();
  if (!isUnauthorized(result)) {
    return result;
  }

  const refreshed = await refreshSessionOnce();
  return refreshed ? request() : result;
}
