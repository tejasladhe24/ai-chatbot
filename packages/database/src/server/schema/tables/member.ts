import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import organization from "./organization";
import user from "./user";
import role from "../enums/role";
import { relations } from "drizzle-orm";
import { z } from "zod";

const table = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.table.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.table.id, { onDelete: "cascade" }),
  role: role.enum("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const zodMember = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.coerce.string(),
  role: role.zod,
  createdAt: z.date(),
});

const _relations = relations(table, ({ one }) => ({
  organization: one(organization.table, {
    fields: [table.organizationId],
    references: [organization.table.id],
  }),
  user: one(user.table, {
    fields: [table.userId],
    references: [user.table.id],
  }),
}));

type DBMember = typeof table.$inferSelect & {
  user: typeof user.table.$inferSelect;
};

export default {
  table,
  zod: zodMember,
  relations: _relations,
};

export type { DBMember };
