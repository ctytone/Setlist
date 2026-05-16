import { z } from "zod";

import { itemStatuses, itemTypeValues } from "@/lib/constants";
import { MAX_RATING, MIN_RATING } from "@/lib/rating";

export const songRatingSchema = z.object({
  trackId: z.string().uuid(),
  rating: z.number().min(MIN_RATING).max(MAX_RATING).multipleOf(0.5),
  isPublic: z.boolean().default(true),
});

export const statusSchema = z.object({
  itemType: z.enum(itemTypeValues),
  itemId: z.string().uuid(),
  status: z.enum(itemStatuses),
});

export const tagAssignmentSchema = z.object({
  itemType: z.enum(itemTypeValues),
  itemId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(150),
  type: z.enum(["album", "artist", "track"]).default("album"),
  limit: z.coerce.number().min(1).max(10).default(10),
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Usernames can only contain letters, numbers, and underscores.");
