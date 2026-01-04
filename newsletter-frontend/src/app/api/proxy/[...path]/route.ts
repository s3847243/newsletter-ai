import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
async function callUpstream(req: NextRequest, upstreamUrl: string, access?: string) {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("cookie");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  return fetch(upstreamUrl, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    cache: "no-store",
  });
}
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = new URL(req.url);

  const upstreamUrl = `${API_BASE_URL}/${path.join("/")}${url.search}`;

  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;
  const refresh = cookieStore.get("refresh_token")?.value;
//   const headers = new Headers(req.headers);
//   headers.delete("host");
//   headers.delete("cookie");

//   if (access) headers.set("Authorization", `Bearer ${access}`);

//   const upstreamRes = await fetch(upstreamUrl, {
//     method: req.method,
//     headers,
//     body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
//     cache: "no-store",
//   });

//   const respBody = await upstreamRes.arrayBuffer();
//   const res = new NextResponse(respBody, { status: upstreamRes.status });

//   upstreamRes.headers.forEach((v, k) => {
//     if (k.toLowerCase() === "set-cookie") return; 
//     res.headers.set(k, v);
//   });
  let upstreamRes = await callUpstream(req, upstreamUrl, access);

  if (upstreamRes.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();

      const isProd = process.env.NODE_ENV === "production";
      const resCookies = await cookies();

      resCookies.set("access_token", refreshData.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 15 * 60,
      });

      resCookies.set("refresh_token", refreshData.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      upstreamRes = await callUpstream(req, upstreamUrl, refreshData.accessToken);
        }
    }
    const respBody = await upstreamRes.arrayBuffer();
    const res = new NextResponse(respBody, { status: upstreamRes.status });

    upstreamRes.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") return;
        res.headers.set(k, v);
    });

    return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
