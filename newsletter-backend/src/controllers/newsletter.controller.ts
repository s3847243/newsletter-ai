import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";
import {
  createNewsletterSchema,
  updateNewsletterSchema,
} from "../routes/newsletter.schemas";
import { slugify } from "../utils/slugify";
import { IssueStatus } from "../generated/prisma/enums";

// Helper to get creatorId for a user
async function getCreatorIdForUser(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// Ensure slug uniqueness per creator
async function generateUniqueSlug(creatorId: string, title: string): Promise<string> {
  const base = slugify(title || "untitled");
  if (!base) {
    return `issue-${Date.now()}`;
  }

  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.newsletterIssue.findFirst({
      where: { creatorId, slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${counter++}`;
  }
}

export const listMyNewsletters = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const creatorId = await getCreatorIdForUser(userId);

    if (!creatorId) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    const issues = await prisma.newsletterIssue.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
    });

    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const createNewsletter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const creatorId = await getCreatorIdForUser(userId);

    if (!creatorId) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    const parsed = createNewsletterSchema.parse(req.body);
    const slug = await generateUniqueSlug(creatorId, parsed.title);

    const issue = await prisma.newsletterIssue.create({
      data: {
        creatorId,
        title: parsed.title,
        slug,
        htmlContent: parsed.htmlContent,
        status: IssueStatus.DRAFT,
        emailSubject: parsed.emailSubject,
        emailIntro: parsed.emailIntro,
      },
    });

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
};

export const getMyNewsletterById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const creatorId = await getCreatorIdForUser(userId);

    if (!creatorId) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    const issue = await prisma.newsletterIssue.findFirst({
      where: { id, creatorId },
    });

    if (!issue) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const updateMyNewsletter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const creatorId = await getCreatorIdForUser(userId);

    if (!creatorId) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    const parsed = updateNewsletterSchema.parse(req.body);

    const existing = await prisma.newsletterIssue.findFirst({
      where: { id, creatorId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    // For now, don't allow changing slug automatically to avoid breaking URLs.
    const updated = await prisma.newsletterIssue.update({
      where: { id },
      data: {
        title: parsed.title ?? existing.title,
        htmlContent: parsed.htmlContent ?? existing.htmlContent,
        emailSubject: parsed.emailSubject ?? existing.emailSubject,
        emailIntro: parsed.emailIntro ?? existing.emailIntro,
        status: parsed.status ?? existing.status,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteMyNewsletter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const creatorId = await getCreatorIdForUser(userId);

    if (!creatorId) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    const existing = await prisma.newsletterIssue.findFirst({
      where: { id, creatorId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    await prisma.newsletterIssue.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
