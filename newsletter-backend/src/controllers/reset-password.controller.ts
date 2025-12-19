import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    console.log(newPassword  )
    if (!emailRaw || !token || !newPassword) {

      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailRaw },
      select: { id: true, resetTokenHash: true, resetTokenExp: true },
    });

    // Generic error to avoid leaking
    if (!user || !user.resetTokenHash || !user.resetTokenExp) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (user.resetTokenExp.getTime() < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const tokenHash = sha256(token);
    if (tokenHash !== user.resetTokenHash) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExp: null,
      },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};
