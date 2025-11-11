import { codeArtifact } from "@artifacts/code-artifact/client";
import { imageArtifact } from "@artifacts/image-artifact/client";
import { sheetArtifact } from "@artifacts/sheet-artifact/client";
import { textArtifact } from "@artifacts/text-artifact/client";

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
