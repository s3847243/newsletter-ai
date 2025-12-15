import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { TransactionalEmail } from "../services/transactionalEmail.service";
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();

    // Always respond 200 (no user enumeration)
    if (!emailRaw) return res.status(200).json({ message: "If the email exists, a reset link was sent." });

    const user = await prisma.user.findUnique({
      where: { email: emailRaw },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token); 
    const exp = new Date(Date.now() + 1000 * 60 * 30); 

    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: tokenHash, resetTokenExp: exp },
    });

    const resetUrl = `${env.sitePublicUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailRaw)}`;
    await TransactionalEmail.send({
      to: emailRaw,
      subject: "Reset your password",
      html: `
        <h2>Password reset</h2>
        <p>You requested a password reset.</p>
        <p>
          <a href="${resetUrl}">
            Click here to reset your password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
      `,
    });
    

    return res.status(200).json({ message: "If the email exists, a reset link was sent." });
  } catch (err) {
    next(err);
  }
};
