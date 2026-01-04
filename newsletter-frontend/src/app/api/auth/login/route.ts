import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!; 

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  const data = text ? JSON.parse(text) : null;
  
  if (!upstream.ok) {
    return NextResponse.json(data ?? { message: "Login failed" }, { status: upstream.status });
  }
  if (!data?.accessToken || !data?.refreshToken) {
    return NextResponse.json(
      { message: "Backend did not return tokens", received: data },
      { status: 500 }
    );
  }
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ user: data.user }, { status: 200 });

  res.cookies.set("access_token", data.accessToken, {
    httpOnly: true,
    secure: isProd,                 
    sameSite: isProd ? "none" : "lax", 
    path: "/",
    maxAge: 15 * 60,
  });

  res.cookies.set("refresh_token", data.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
