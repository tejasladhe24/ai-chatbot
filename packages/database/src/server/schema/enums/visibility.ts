import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const visibilities = ["public", "private"] as const;

const visibility = pgEnum("visibility", visibilities);

type DBVisibility = (typeof visibilities)[number];

const zodVisibility = z.enum(visibility.enumValues);

export default {
  enum: visibility,
  zod: zodVisibility,
};

export type { DBVisibility };
