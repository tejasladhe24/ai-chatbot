import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import user from "./user";
import { z } from "zod";

const table = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.table.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

type DBAccount = typeof table.$inferSelect;

const zodAccount = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.coerce.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  password: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export default {
  table,
  zod: zodAccount,
};

export type { DBAccount };
