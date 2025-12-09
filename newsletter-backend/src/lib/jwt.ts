// src/lib/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const ACCESS_EXPIRES_IN = "15m";     // or "30m", up to you
const REFRESH_EXPIRES_IN = "7d";     // or "30d"

type JwtUserPayload = {
  sub: string;         // user id
  email: string;
};

export function signAccessToken(user: { id: string; email: string }) {
  const payload: JwtUserPayload = {
    sub: user.id,
    email: user.email,
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(user: { id: string; email: string }) {
  const payload: JwtUserPayload = {
    sub: user.id,
    email: user.email,
  };

  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtAccessSecret) as JwtUserPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtUserPayload;
}
