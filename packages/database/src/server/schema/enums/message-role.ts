import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const messageRoles = ["user", "assistant", "system"] as const;
type DBMessageRole = (typeof messageRoles)[number];

const messageRole = pgEnum("message_role", messageRoles);

const zodMessageRole = z.enum(messageRole.enumValues);

export default {
  enum: messageRole,
  zod: zodMessageRole,
};

export type { DBMessageRole };
