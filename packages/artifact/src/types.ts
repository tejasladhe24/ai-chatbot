import type { DBArtifactKind } from "@workspace/database/types";

export type UIArtifact = {
  title: string;
  documentId: string;
  kind: DBArtifactKind;
  content: string;
  isVisible: boolean;
  status: "streaming" | "idle";
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};
