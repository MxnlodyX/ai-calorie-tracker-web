// app/api/auth/google/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  const googleAuthUrl = process.env.GOOGLE_AUTH_URL;

  if (!googleAuthUrl) {
    return NextResponse.json(
      { error: "GOOGLE_AUTH_URL is not configured" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      url: googleAuthUrl,
    },
  });
}