import { pgTable, text, boolean, primaryKey } from "drizzle-orm/pg-core";
import { z } from "zod";
import chat from "./chat";
import message from "./message";

const table = pgTable(
  "vote",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.table.id, { onDelete: "cascade" }),
    messageId: text("message_id")
      .notNull()
      .references(() => message.table.id, { onDelete: "cascade" }),
    isUpvoted: boolean("is_upvoted").notNull(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.messageId] })]
);

type DBVote = typeof table.$inferSelect;

const zodVote = z.object({
  chatId: z.string(),
  messageId: z.string(),
  isUpvoted: z.boolean(),
});

export default {
  table,
  zod: zodVote,
};

export type { DBVote };
