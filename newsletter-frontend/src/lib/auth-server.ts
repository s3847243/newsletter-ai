import { cookies } from "next/headers";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  return token ?? null;
}

export async function getUserFromRequest(): Promise<{ email: string } | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  // Option A: if your token is a JWT and includes email, decode it server-side
  // Option B (safer): call your backend /me endpoint
  // For now, assume you have /auth/me:
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
