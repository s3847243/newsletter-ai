import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";
import { IssueStatus } from "../generated/prisma/enums";
export const getTimeline = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // Basic pagination
    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = Math.min(
      parseInt((req.query.pageSize as string) || "20", 10),
      50
    ); // cap at 50

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 1) Find creators this user follows
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { creatorId: true },
    });

    if (follows.length === 0) {
      return res.json({
        page,
        pageSize,
        total: 0,
        items: [],
      });
    }

    const creatorIds = follows.map((f:any) => f.creatorId);

    // 2) Fetch published newsletters from followed creators
    const [items, total] = await Promise.all([
      prisma.newsletterIssue.findMany({
        where: {
          creatorId: { in: creatorIds },
          status: IssueStatus.PUBLISHED,
          publishedAt: { not: null },
        },
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
        orderBy: { publishedAt: "desc" },
        skip,
        take,
      }),
      prisma.newsletterIssue.count({
        where: {
          creatorId: { in: creatorIds },
          status: IssueStatus.PUBLISHED,
          publishedAt: { not: null },
        },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      items,
    });
  } catch (err) {
    next(err);
  }
};
