import { z } from "zod";

export const createCreatorProfileSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, underscore"),
  displayName: z.string().min(1),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  niche: z.string().max(100).optional(),
});

export const updateCreatorProfileSchema = createCreatorProfileSchema.partial();

export type CreateCreatorProfileInput = z.infer<typeof createCreatorProfileSchema>;
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
