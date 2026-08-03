// features/authentication/service/auth-service.ts

type GoogleSignInResponse = {
    url: string;
};

export async function startGoogleSignIn(): Promise<void> {
    const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Google sign in failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { data: GoogleSignInResponse };

    window.location.href = payload.data.url;
}