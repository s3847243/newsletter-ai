import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { IssueStatus } from "../generated/prisma/enums";
export const getPublicCreator = async (
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
      where: { handle }, // now typed as string ✅
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

export const getPublicIssueByHandleAndSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle, slug } = req.params as { handle: string; slug: string };

    if (!handle || !slug) {
      return res
        .status(400)
        .json({ message: "Creator handle and issue slug are required" });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const issue = await prisma.newsletterIssue.findFirst({
      where: {
        creatorId: creator.id,
        slug,
        status: IssueStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        htmlContent: true,
        publishedAt: true,
        viewCount: true,
        emailIntro: true,
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Increment view count
    await prisma.newsletterIssue.update({
      where: { id: issue.id },
      data: { viewCount: issue.viewCount + 1 },
    });

    // Return both creator + issue
    res.json({
      creator: {
        id: creator.id,
        handle: creator.handle,
        displayName: creator.displayName,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        user: creator.user, // has { name, image }
      },
      issue,
    });
  } catch (err) {
    next(err);
  }
};
export const getPublicCreatorIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle } = req.params as { handle: string };

    if (!handle) {
      return res.status(400).json({ message: "Creator handle is required" });
    }

    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) || "20", 10);

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({ message: "Invalid pagination params" });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { handle },
      select: { id: true },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const [total, issues] = await Promise.all([
      prisma.newsletterIssue.count({
        where: {
          creatorId: creator.id,
          status: "PUBLISHED",
        },
      }),
      prisma.newsletterIssue.findMany({
        where: {
          creatorId: creator.id,
          status: "PUBLISHED",
          deletedAt: null,
        },
        orderBy: {
          publishedAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          viewCount: true,
          emailIntro: true,
        },
      }),
    ]);

    return res.json({
      page,
      pageSize,
      total,
      items: issues,
    });
  } catch (err) {
    next(err);
  }
};

export const checkHandleAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const handleRaw = String(req.query.handle || "").trim();

    if (!handleRaw) {
      return res.status(400).json({ available: false, reason: "missing" });
    }

    const handle = handleRaw.toLowerCase();

    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      return res.status(200).json({ available: false, reason: "invalid" });
    }

    // (optional) reserve system routes
    const reserved = new Set([
      "login",
      "register",
      "dashboard",
      "api",
      "unsubscribe",
      "terms",
      "privacy",
    ]);
    if (reserved.has(handle)) {
      return res.status(200).json({ available: false, reason: "reserved" });
    }

    const exists = await prisma.creatorProfile.findUnique({
      where: { handle },
      select: { id: true },
    });

    return res.json({ available: !exists });
  } catch (err) {
    next(err);
  }
};