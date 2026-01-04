import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${UPSTREAM_API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Just forward backend response (no cookies needed for register)
  return NextResponse.json(data ?? { message: "Registration failed" }, {
    status: upstream.status,
  });
}
