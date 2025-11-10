import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import user from "./user";
import { z } from "zod";

const table = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.table.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
});

type DBSession = typeof table.$inferSelect;

const zodSession = z.object({
  id: z.string(),
  expiresAt: z.date(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.coerce.string(),
  activeOrganizationId: z.string().nullish(),
});

export default {
  table,
  zod: zodSession,
};

export type { DBSession };
