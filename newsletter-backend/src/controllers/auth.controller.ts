import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { loginSchema, registerSchema } from "../routes/auth.schemas";
import { signAccessToken,signRefreshToken, verifyAccessToken, verifyRefreshToken, } from "../lib/jwt";
import { TransactionalEmail } from "../services/transactionalEmail.service";
import { buildVerifyEmailHtml } from "../services/verifyEmail";
import { generateRawToken, hashToken } from "../utils/tokens";
import { setAuthCookies , clearAuthCookies} from "../utils/authCookies";
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        name: parsed.name ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const raw = generateRawToken();
    const tokenHash = hashToken(raw);
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyTokenHash: tokenHash,
        emailVerifyTokenExpiresAt: expires,
      },
    });

    const verifyUrl = `${env.sitePublicUrl}/verify-email?token=${raw}`;
    await TransactionalEmail.send({
      to: user.email,
      subject: "Verify your email",
      html: buildVerifyEmailHtml({ verifyUrl }),
    });
    return res.status(201).json({
      message: "Account created. Please verify your email to log in.",
      code: "EMAIL_VERIFICATION_REQUIRED",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    const isProd = env.nodeEnv === "production";
    const cookieSecure = isProd;
    const cookieSameSite = isProd ? "none" : "lax";
    
    // const accessToken = signAccessToken({ id: user.id, email: user.email });
    // const refreshToken = signRefreshToken({ id: user.id, email: user.email });
    // setAuthCookies(res, accessToken, refreshToken, {
    //   secure: cookieSecure,
    //   sameSite: cookieSameSite,
      
    // });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      (req.body && req.body.refreshToken); // optional fallback while migrating

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });

    if (!user || !user.emailVerifiedAt) {
      return res.status(403).json({
        message: "Please verify your email before continuing.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
    });

    const newRefreshToken = signRefreshToken({
      id: user.id,
      email: user.email,
    });
    const isProd = env.nodeEnv === "production";
    const cookieSecure = isProd;
    const cookieSameSite = isProd ? "none" : "lax";

    // setAuthCookies(res, newAccessToken, newRefreshToken, {
    //   secure: cookieSecure,
    //   sameSite: cookieSameSite,
    // });
     // cross-site (Vercel frontend + separate API domain) => SameSite=None + Secure
    // res.cookie("access_token", newAccessToken, {
    //   httpOnly: true,
    //   secure: isProd,
    //   sameSite: isProd ? "none" : "lax",
    //   path: "/",
    //   maxAge: 15 * 60 * 1000,
    // });

    // res.cookie("refresh_token", newRefreshToken, {
    //   httpOnly: true,
    //   secure: isProd,
    //   sameSite: isProd ? "none" : "lax",
    //   path: "/",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      // accessToken: newAccessToken,
      // refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};
export const resendVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    if (!emailRaw) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email: emailRaw } });

    if (!user || user.emailVerifiedAt) {
      return res.status(200).json({ message: "If an account exists, we sent a verification email." });
    }

    const raw = generateRawToken();
    const tokenHash = hashToken(raw);
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyTokenHash: tokenHash,
        emailVerifyTokenExpiresAt: expires,
      },
    });

    const verifyUrl = `${env.sitePublicUrl}/verify-email?token=${raw}`;
    await TransactionalEmail.send({
      to: user.email,
      subject: "Verify your email",
      html: buildVerifyEmailHtml({ verifyUrl }),
    });

    return res.status(200).json({ message: "If an account exists, we sent a verification email." });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenRaw = String(req.body?.token || "").trim();
    if (!tokenRaw) return res.status(400).json({ message: "Token is required" });

    const tokenHash = hashToken(tokenRaw);

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyTokenHash: tokenHash,
        emailVerifyTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyTokenHash: null,
        emailVerifyTokenExpiresAt: null,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};


export const logout = async (req: Request, res: Response) => {
  const isProd = env.nodeEnv === "production";
  clearAuthCookies(res, {
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  return res.json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  // You can read from access cookie and verify it
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ message: "Unauthenticated" });

  try {
    const payload = verifyAccessToken(token); // your verifier
    return res.json({ email: payload.email, id: payload.sub });
  } catch {
    return res.status(401).json({ message: "Unauthenticated" });
  }
};
