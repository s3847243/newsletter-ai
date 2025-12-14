import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import {
  createCreatorProfileSchema,
  updateCreatorProfileSchema,
} from "../routes/creatorProfile.schemas";
import type { AuthRequest } from "../middlewares/auth";

export const getMyCreatorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
     const creator = await prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            followers: true,   // people who follow you
            subscribers: true,
            newsletters: true,
          },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator profile not found" });
    }
    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    res.json({
      ...creator,
      followingCount,
    });
  } catch (err) {
    next(err);
  }
};

export const createCreatorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
    const parsed = createCreatorProfileSchema.parse(req.body);

    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      return res.status(400).json({ message: "Creator profile already exists" });
    }

    const handleInUse = await prisma.creatorProfile.findUnique({
      where: { handle: parsed.handle },
    });
    if (handleInUse) {
      return res.status(400).json({ message: "Handle already taken" });
    }

    const profile = await prisma.creatorProfile.create({
      data: {
        userId,
        handle: parsed.handle,
        displayName: parsed.displayName,
        bio: parsed.bio ?? null,
        avatarUrl: parsed.avatarUrl ?? null,
        niche: parsed.niche ?? null,
      },
    });

    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateCreatorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
    const parsed = updateCreatorProfileSchema.parse(req.body);

    const existing = await prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Creator profile not found" });
    }

    if (parsed.handle && parsed.handle !== existing.handle) {
      const handleInUse = await prisma.creatorProfile.findUnique({
        where: { handle: parsed.handle },
      });
      if (handleInUse && handleInUse.userId !== userId) {
        return res.status(400).json({ message: "Handle already taken" });
      }
    }

    const updated = await prisma.creatorProfile.update({
      where: { userId },
      data: {
        handle: parsed.handle ?? existing.handle,
        displayName: parsed.displayName ?? existing.displayName,
        bio: parsed.bio ?? existing.bio,
        avatarUrl: parsed.avatarUrl ?? existing.avatarUrl,
        niche: parsed.niche ?? existing.niche,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const getCreatorByHandle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle } = req.params as { handle: string }; 

    if (!handle) {
      return res.status(400).json({ message: "Creator handle is required" });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: { name: true, image: true },
        },
        _count: {
          select: {
            followers: true,
            subscribers: true,
            newsletters: true,
          },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    res.json(creator);
  } catch (err) {
    next(err);
  }
};

export const listMyFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10)));

    const me = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!me) {
      return res.status(404).json({ message: "Creator profile not found" });
    }

    const [total, rows] = await Promise.all([
      prisma.follow.count({
        where: { creatorId: me.id },
      }),
      prisma.follow.findMany({
        where: { creatorId: me.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              image: true,
              creatorProfile: {
                select: {
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const items = rows.map((r) => ({
      userId: r.follower.id,
      displayName:
        r.follower.creatorProfile?.displayName ??
        r.follower.name ??
        "Unknown",
      handle: r.follower.creatorProfile?.handle ?? null,
      avatarUrl:
        r.follower.creatorProfile?.avatarUrl ??
        r.follower.image ??
        null,
      followedAt: r.createdAt,
    }));

    res.json({ page, pageSize, total, items });
  } catch (err) {
    next(err);
  }
};

export const listMyFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10)));

    const [total, rows] = await Promise.all([
      prisma.follow.count({
        where: { followerId: userId },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          creator: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((r) => ({
      creatorId: r.creator.id,
      handle: r.creator.handle,
      displayName: r.creator.displayName,
      avatarUrl: r.creator.avatarUrl,
      followedAt: r.createdAt,
    }));

    res.json({ page, pageSize, total, items });
  } catch (err) {
    next(err);
  }
};
