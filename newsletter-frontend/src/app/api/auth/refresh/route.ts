import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }), 
  });

  const text = await upstream.text();
  const data = text ? JSON.parse(text) : null;

  if (!upstream.ok) {
    return NextResponse.json(data ?? { message: "Refresh failed" }, { status: upstream.status });
  }

  const res = NextResponse.json({ user: data.user }, { status: 200 });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set("access_token", data.newAccessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  res.cookies.set("refresh_token", data.newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
