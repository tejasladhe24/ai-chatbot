import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import chat from "./chat";

const table = pgTable("stream", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chat.table.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
});

type DBStream = typeof table.$inferSelect;

const zodStream = z.object({
  id: z.string(),
  chatId: z.string(),
  createdAt: z.date(),
});

export default {
  table,
  zod: zodStream,
};

export type { DBStream };
