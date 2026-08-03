export function startGoogleSignIn(): void {
  window.location.href = "/api/auth/google";
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  }).catch(() => undefined);
}
