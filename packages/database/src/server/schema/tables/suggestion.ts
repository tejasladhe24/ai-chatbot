import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import member from "./member";

const table = pgTable("suggestion", {
  id: text("id").primaryKey().notNull(),
  documentId: text("document_id").notNull(),
  documentCreatedAt: timestamp("document_created_at").notNull(),
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  description: text("description"),
  isResolved: boolean("is_resolved").notNull().default(false),
  memberId: text("member_id")
    .notNull()
    .references(() => member.table.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

type DBSuggestion = typeof table.$inferSelect;

const zodSuggestion = z.object({
  id: z.string(),
  documentId: z.string(),
  documentCreatedAt: z.date(),
  originalText: z.string(),
  suggestedText: z.string(),
  description: z.string().nullish(),
  isResolved: z.boolean(),
  memberId: z.string(),
  createdAt: z.date(),
});

export default {
  table,
  zod: zodSuggestion,
};

export type { DBSuggestion };
