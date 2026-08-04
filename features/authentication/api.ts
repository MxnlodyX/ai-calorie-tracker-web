import { API_BASE_URL } from "@/lib/api-url";
import { apiFetch } from "@/lib/api-client";

export function startGoogleSignIn(): void {
  window.location.assign(`${API_BASE_URL}/authentications/google`);
}

export async function logout(): Promise<void> {
  const response = await apiFetch("/authentications/logout", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(`Logout failed with status ${response.status}`);
  }
}
