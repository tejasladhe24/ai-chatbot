import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { artifactKind } from "../enums";
import member from "./member";

const table = pgTable(
  "document",
  {
    id: text("id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: artifactKind.enum("kind").notNull().default("text"),
    memberId: text("member_id")
      .notNull()
      .references(() => member.table.id),
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })]
);

type DBDocument = typeof table.$inferSelect;

const zodDocument = z.object({
  id: z.string(),
  createdAt: z.date(),
  title: z.string(),
  content: z.string().nullish(),
  kind: artifactKind.zod,
  memberId: z.string(),
});

export default {
  table,
  zod: zodDocument,
};

export type { DBDocument };
