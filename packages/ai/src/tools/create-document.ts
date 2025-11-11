import { container } from "@workspace/di";
import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { DocumentHandler, type ChatMessage } from "../types";
import { nanoid } from "nanoid";
import { type DBArtifactKind } from "@workspace/database/types";
import { artifactKinds } from "@workspace/database/server";

type CreateDocumentProps = {
  memberId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createDocument = ({ memberId, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.",
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = nanoid();

      dataStream.write({
        type: "data-kind",
        data: kind,
        transient: true,
      });

      dataStream.write({
        type: "data-id",
        data: id,
        transient: true,
      });

      dataStream.write({
        type: "data-title",
        data: title,
        transient: true,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const handlers =
        container.resolveAll<DocumentHandler<DBArtifactKind>>(
          "DocumentHandler"
        );

      if (!handlers) {
        throw new Error("Couldn't resolve document handlers");
      }

      const documentHandler = handlers.find((handler) => handler.kind === kind);

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        memberId,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      };
    },
  });
