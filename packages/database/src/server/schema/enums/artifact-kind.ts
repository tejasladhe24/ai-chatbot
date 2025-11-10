import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const artifactKinds = ["text", "code", "image", "sheet"] as const;
type DBArtifactKind = (typeof artifactKinds)[number];

const artifactKind = pgEnum("artifact_kind", artifactKinds);

const zodArtifactKind = z.enum(artifactKind.enumValues);

export default {
  enum: artifactKind,
  zod: zodArtifactKind,
};

export type { DBArtifactKind };
