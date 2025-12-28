import type { Response } from "express";

type CookieOpts = {
  secure: boolean;
  sameSite: "lax" | "none";
  domain?: string;
};

function cookieOptions(base: CookieOpts) {
  return {
    httpOnly: true,
    secure: base.secure,
    sameSite: base.sameSite,
    path: "/",
    ...(base.domain ? { domain: base.domain } : {}),
  } as const;
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  opts: CookieOpts
) {
  // Access token shorter
  res.cookie("access_token", accessToken, {
    ...cookieOptions(opts),
    maxAge: 15 * 60 * 1000, // 15 min
  });

  // Refresh token longer
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions(opts),
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export function clearAuthCookies(res: Response, opts: CookieOpts) {
  res.clearCookie("access_token", { ...cookieOptions(opts) });
  res.clearCookie("refresh_token", { ...cookieOptions(opts) });
}
