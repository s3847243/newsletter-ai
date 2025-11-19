import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";
import { EmailService } from "../services/email.service";
import { env } from "../config/env";
import { buildNewsletterEmailHtml } from "../services/emailTemplates";
import { IssueStatus } from "../generated/prisma/enums";
export const publishNewsletter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Find creator profile for user
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!creator) {
      return res.status(400).json({ message: "You must create a creator profile first" });
    }

    // Find the issue owned by this creator
    const issue = await prisma.newsletterIssue.findFirst({
      where: {
        id,
        creatorId: creator.id,
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    if (issue.status === IssueStatus.PUBLISHED) {
      // Already published; you can choose to allow republish / resend or not
      return res.status(400).json({ message: "Issue is already published" });
    }

    // Mark as published
    const publishedAt = new Date();
    const updatedIssue = await prisma.newsletterIssue.update({
      where: { id: issue.id },
      data: {
        status: IssueStatus.PUBLISHED,
        publishedAt,
      },
    });

    // Build URLs
    const handle = creator.handle;
    const publicReadUrl = `${env.sitePublicUrl}/${handle}/${issue.slug}`;

    // Unsubscribe URL -> e.g. /unsubscribe?creatorHandle=...&email=...
    // email will be populated client-side from query param.
    const unsubscribeBaseUrl = `${env.sitePublicUrl}/unsubscribe`;

    // Get all active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: {
        creatorId: creator.id,
        isSubscribed: true,
      },
    });

    const recipientEmails = subscribers.map((s:any) => s.email);

    // Build email content
    const creatorName = creator.displayName || creator.user?.name || handle;

    const subject =
      issue.emailSubject ||
      `${creatorName} — ${issue.title}`;

    // For unsubscribe link, we will pass only creatorHandle, email is filled by frontend.
    const unsubscribeUrl = `${unsubscribeBaseUrl}?creatorHandle=${encodeURIComponent(
      handle
    )}`;

    const html = buildNewsletterEmailHtml({
      creatorName,
      issueTitle: issue.title,
      intro: issue.emailIntro,
      readUrl: publicReadUrl,
      unsubscribeUrl,
    });

    // Send email blast (if we have subscribers)
    if (recipientEmails.length > 0) {
      try {
        await EmailService.send({
          to: recipientEmails,
          subject,
          html,
        });
      } catch (emailErr) {
        console.error("[publishNewsletter] Email blast failed:", emailErr);
        // You can optionally revert publish if email fails.
        // For now, we keep it published but return a warning.
        return res.status(200).json({
          message:
            "Issue published, but there was an error sending emails. Check server logs.",
          issue: updatedIssue,
        });
      }
    }

    res.status(200).json({
      message: "Issue published and emails sent (if subscribers exist).",
      issue: updatedIssue,
    });
  } catch (err) {
    next(err);
  }
};
