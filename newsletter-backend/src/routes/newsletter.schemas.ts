import { z } from "zod";

export const createNewsletterSchema = z.object({
  title: z.string().min(1),
  htmlContent: z.string().min(1),
  emailSubject: z.string().optional(),
  emailIntro: z.string().optional(),
});

export const updateNewsletterSchema = z.object({
  title: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  emailSubject: z.string().optional(),
  emailIntro: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(), // we'll mostly use DRAFT here for now
});

export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;
