import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { loginSchema, registerSchema } from "../routes/auth.schemas";
import { signAccessToken,signRefreshToken, verifyRefreshToken, } from "../lib/jwt";

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