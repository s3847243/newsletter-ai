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
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ message: "Creator profile not found" });
    }

    res.json(profile);
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
    const { handle } = req.params as { handle: string }; // 👈 tell TS it's string

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
