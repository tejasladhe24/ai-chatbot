import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { messageRole } from "../enums";
import chat from "./chat";

const table = pgTable("message", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chat.table.id, { onDelete: "cascade" }),
  role: messageRole.enum("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

type DBMessage = typeof table.$inferSelect;

const zodMessage = z.object({
  id: z.string(),
  memberId: z.string(),
  role: messageRole.zod,
  parts: z.array(z.any()),
  attachments: z.array(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export default {
  table,
  zod: zodMessage,
};

export type { DBMessage };
