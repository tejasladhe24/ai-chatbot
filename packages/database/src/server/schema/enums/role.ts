import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const roles = ["member", "admin", "owner"] as const;
type DBRole = (typeof roles)[number];

const role = pgEnum("role", roles);

const zodRole = z.enum(role.enumValues);

export default {
  enum: role,
  zod: zodRole,
};

export type { DBRole };
