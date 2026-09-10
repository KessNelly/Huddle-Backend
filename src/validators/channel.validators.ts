import { z } from "zod";

export const channelIdSchema = z.object({
  channelId: z.string().uuid("Channel ID must be a valid UUID"),
});

export const messageListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content cannot be empty").max(2_000, "Message cannot exceed 2000 characters"),
});
