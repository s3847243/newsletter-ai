// import type{ Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import { env } from "../config/env";
// import { verifyAccessToken } from "../lib/jwt";
// export type AuthUser = {
//   id: string;
//   email?: string | undefined;
// };
// type JwtPayload = {
//   sub: string;
//   email?: string; 
// };
// export interface AuthRequest extends Request {
//   user?: AuthUser;  
// }


// export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Missing or invalid token" });
//   }

//   const token = header.slice("Bearer ".length);

//   try {
//     const payload = verifyAccessToken(token);

//     req.user = {
//       id: payload.sub,
//       email: payload.email,
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// }
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

export type AuthUser = {
  id: string;
  email?: string;
};

export interface AuthRequest extends Request {
  user?: AuthUser;
}

function getTokenFromRequest(req: Request): string | null {
  // 1) Bearer token (optional, for backwards compatibility)
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  // 2) Cookie token (NEW for httpOnly cookie auth)
  const cookieToken = (req as any).cookies?.access_token;
  if (cookieToken) return cookieToken;

  return null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
