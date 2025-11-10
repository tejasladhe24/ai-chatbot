import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import organization from "./organization";
import user from "./user";
import role from "../enums/role";
import { z } from "zod";

const table = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.table.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: role.enum("role").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.table.id, { onDelete: "cascade" }),
});

type DBInvitation = typeof table.$inferSelect;

const zodInvitation = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: role.zod,
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
});

export default {
  table,
  zod: zodInvitation,
};

export type { DBInvitation };
