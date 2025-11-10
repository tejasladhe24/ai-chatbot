import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import member from "./member";
import { visibility } from "../enums";

const table = pgTable("chat", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .notNull()
    .references(() => member.table.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  visibility: visibility.enum("visibility").default("public").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastContext: jsonb("last_context"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

type DBChat = typeof table.$inferSelect;

const zodChat = z.object({
  id: z.string(),
  memberId: z.string(),
  title: z.string(),
  visibility: visibility.zod,
  createdAt: z.date(),
  updatedAt: z.date(),
  lastContext: z.record(z.string(), z.any()),
});

export default {
  table,
  zod: zodChat,
};

export type { DBChat };
