import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { loginSchema, registerSchema } from "../routes/auth.schemas";
import { signAccessToken,signRefreshToken, verifyRefreshToken, } from "../lib/jwt";
import { TransactionalEmail } from "../services/transactionalEmail.service";
import { buildVerifyEmailHtml } from "../services/verifyEmail";
import { generateRawToken, hashToken } from "../utils/tokens";
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

    const accessToken = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });
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
    res.status(201).json({  
      user,
      accessToken,
      refreshToken,
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

    const accessToken = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
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
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
    });

    const newRefreshToken = signRefreshToken({
      id: user.id,
      email: user.email,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};
export const resendVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    if (!emailRaw) return res.status(400).json({ message: "Email is required" });

    // IMPORTANT: don't reveal if email exists
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
