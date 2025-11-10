import { text, pgTable, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

const table = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: text("metadata"),
});

type DBOrganization = typeof table.$inferSelect;

const zodOrganization = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
});

export default {
  table,
  zod: zodOrganization,
};

export type { DBOrganization };
