import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

const table = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

type DBVerification = typeof table.$inferSelect;

const zodVerification = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export default {
  table,
  zod: zodVerification,
};

export type { DBVerification };
