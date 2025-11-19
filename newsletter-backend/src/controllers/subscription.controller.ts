import type{ Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { subscribeSchema, unsubscribeSchema } from "../routes/subscription.schemas";

async function resolveCreatorId(input: {
  creatorId?: string | undefined;
  creatorHandle?: string| undefined;
}): Promise<string | null> {
  if (input.creatorId) return input.creatorId;

  if (input.creatorHandle) {
    const creator = await prisma.creatorProfile.findUnique({
      where: { handle: input.creatorHandle },
      select: { id: true },
    });
    return creator?.id ?? null;
  }

  return null;
}

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = subscribeSchema.parse(req.body);

    const creatorId = await resolveCreatorId({
      creatorId: parsed.creatorId,
      creatorHandle: parsed.creatorHandle,
    });

    if (!creatorId) {
      return res.status(404).json({ message: "Creator not found" });
    }
    
    const existing = await prisma.subscriber.findFirst({
      where: {
        creatorId,
        email: parsed.email,
      },
    });

    let subscriber;

    if (!existing) {
      subscriber = await prisma.subscriber.create({
        data: {
          creatorId,
          email: parsed.email,
          isSubscribed: true,
        },
      });
    } else if (!existing.isSubscribed) {
      subscriber = await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          isSubscribed: true,
          unsubscribedAt: null,
        },
      });
    } else {
      subscriber = existing;
    }

    res.status(200).json({
      message: "Subscribed successfully",
      subscriber,
    });
  } catch (err) {
    next(err);
  }
};

export const unsubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = unsubscribeSchema.parse(req.body);

    const creatorId = await resolveCreatorId({
      creatorId: parsed.creatorId,
      creatorHandle: parsed.creatorHandle,
    });

    if (!creatorId) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const existing = await prisma.subscriber.findFirst({
      where: {
        creatorId,
        email: parsed.email,
      },
    });

    if (!existing) {
      // You can either 404 or still return success; I’ll keep it idempotent
      return res.status(200).json({ message: "Already unsubscribed" });
    }

    if (!existing.isSubscribed) {
      return res.status(200).json({ message: "Already unsubscribed" });
    }

    await prisma.subscriber.update({
      where: { id: existing.id },
      data: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
      },
    });

    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (err) {
    next(err);
  }
};
