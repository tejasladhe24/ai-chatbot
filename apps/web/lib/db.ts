import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";
import { DatabaseService, schema } from "@workspace/database/server";

export const db: ReturnType<typeof drizzle<typeof schema>> = drizzle(
  env.DATABASE_URL,
  { schema }
);

export const databaseService = new DatabaseService(db);
