import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
export type AuthUser = {
  id: string;
  email?: string | undefined;
};
type JwtPayload = {
  sub: string;
  email?: string; // only if you actually encode it
};
export interface AuthRequest extends Request {
  user?: AuthUser;  
}


export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
    };


    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
