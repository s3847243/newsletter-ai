import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";

export const followCreator = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
     if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userId: string = req.user.id;

    // 2) Narrow params type so creatorId is a definite string
    const { creatorId } = req.params as { creatorId: string };

    if (!creatorId) {
      return res.status(400).json({ message: "creatorId is required" });
    }

    // 3) Check that creator exists
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId }, // creatorId: string ✅
      select: { id: true, userId: true },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // prevent following yourself 
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
    const userId = req.user?.id!;
    const { creatorId } = req.params as { creatorId: string };

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
