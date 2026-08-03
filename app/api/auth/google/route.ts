// app/api/auth/google/route.ts

import { NextResponse } from "next/server";

export function GET() {
  const googleAuthUrl = process.env.GOOGLE_AUTH_URL;

  if (!googleAuthUrl) {
    return NextResponse.json(
      { error: "GOOGLE_AUTH_URL is not configured" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(googleAuthUrl);
}
