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
