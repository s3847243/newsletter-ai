import { z } from "zod";

export const subscribeSchema = z
  .object({
    email: z.string().email(),
    creatorId: z.string().optional(),
    creatorHandle: z.string().optional(),
  })
  .refine(
    (data) => data.creatorId || data.creatorHandle,
    { message: "Either creatorId or creatorHandle is required" }
  );

export const unsubscribeSchema = subscribeSchema;

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
