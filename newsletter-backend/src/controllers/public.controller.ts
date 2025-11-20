import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { IssueStatus } from "../generated/prisma/enums";
export const getPublicCreator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle } = req.params;

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

export const getPublicIssueByHandleAndSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { handle, slug } = req.params;

    const creator = await prisma.creatorProfile.findUnique({
      where: { handle },
      select: { id: true },
    });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const issue = await prisma.newsletterIssue.findFirst({
      where: {
        creatorId: creator.id,
        slug,
        status: IssueStatus.PUBLISHED, // only published issues public
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    
    await prisma.newsletterIssue.update({
      where: { id: issue.id },
      data: { viewCount: issue.viewCount + 1 },
    });

    res.json(issue);
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
    const { handle } = req.params;

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
    // let your global error middleware handle it
    next(err);
  }
};