import { getApiUrl } from "@/lib/api-url";

export type ApiResponse<T> = {
  data: T;
};

type ApiErrorResponse = {
  error?: string;
};

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(path), {
    ...init,
    credentials: "include",
  });
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as
    | ApiResponse<T>
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : `Request failed with status ${response.status}`,
    );
  }

  if (!("data" in payload)) {
    throw new Error("Response payload is missing data.");
  }

  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiFetch(path, {
    headers: {
      Accept: "application/json",
    },
  });

  return parseApiResponse<T>(response);
}

export async function apiPost<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPut<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await apiFetch(path, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiPatch<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await apiFetch(path, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<TResponse>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const response = await apiFetch(path, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 204) {
    return;
  }

  await parseApiResponse<unknown>(response);
}
