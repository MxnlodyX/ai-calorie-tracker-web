// app/api/auth/google/route.ts

import { NextResponse } from "next/server";

export async function POST() {
    const googleAuthUrl = process.env.GOOGLE_AUTH_URL || "http://localhost:4000/authentications/google";

    return NextResponse.json({
        data: {
            url: googleAuthUrl,
        },
    });
}