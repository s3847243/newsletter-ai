// src/controllers/creator.controller.ts
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
import { prisma } from "../lib/prisma";

// Shape: matches what the frontend expects as CreatorSummary
// id, handle, displayName, avatarUrl?
// (You don't need this type exported unless you want to reuse)
const creatorSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
} as const;

/**
 * GET /api/v1/creators/following
 * Returns creators that the current user is following.
 */
export const listFollowingCreators = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find all creators where there is a Follow row with this user as follower
    const creators = await prisma.creatorProfile.findMany({
      where: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
      select: creatorSelect,
      orderBy: {
        displayName: "asc",
      },
    });

    return res.json({ items: creators });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/creators/search?query=...
 * Returns matching creators by handle/displayName.
 */
export const searchCreators = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id!;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rawQuery = (req.query.query as string | undefined) ?? "";
    const q = rawQuery.trim();

    if (!q) {
      // Empty search → empty list (frontend handles this)
      return res.json({ items: [] });
    }

    // Optional: exclude the user's own creator profile
    const myCreator = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const creators = await prisma.creatorProfile.findMany({
      where: {
        AND: [
          myCreator
            ? {
                id: {
                  not: myCreator.id,
                },
              }
            : {},
          {
            OR: [
              {
                handle: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                displayName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: creatorSelect,
      take: 20,
      orderBy: {
        displayName: "asc",
      },
    });

    return res.json({ items: creators });
  } catch (err) {
    next(err);
  }
};
