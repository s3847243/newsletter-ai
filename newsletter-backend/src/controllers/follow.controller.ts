import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";

export const followCreator = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { creatorId } = req.params;

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { id: true, userId: true },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // Optional: prevent following yourself (if you like)
    if (creator.userId === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId: userId,
          creatorId,
        },
      },
    });

    if (existing) {
      return res.status(200).json({ message: "Already following" });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        creatorId,
      },
    });

    res.status(201).json({
      message: "Followed successfully",
      follow,
    });
  } catch (err) {
    next(err);
  }
};

export const unfollowCreator = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { creatorId } = req.params;

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId: userId,
          creatorId,
        },
      },
    });

    if (!existing) {
      return res.status(200).json({ message: "Not following" });
    }

    await prisma.follow.delete({
      where: {
        followerId_creatorId: {
          followerId: userId,
          creatorId,
        },
      },
    });

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    next(err);
  }
};
