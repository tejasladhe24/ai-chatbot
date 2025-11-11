import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage, DocumentHandler } from "@/types";
import { type DBArtifactKind } from "@workspace/database/types";
import { DatabaseService } from "@workspace/database/server";
import { container } from "@workspace/di";

type UpdateDocumentProps = {
  memberId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const updateDocument = ({ memberId, dataStream }: UpdateDocumentProps) =>
  tool({
    description: "Update a document with the given description.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the document to update"),
      description: z
        .string()
        .describe("The description of changes that need to be made"),
    }),
    execute: async ({ id, description }) => {
      const databaseService = container.resolve<DatabaseService>("db");

      if (!databaseService) {
        throw new Error("Database service not found");
      }

      const document = await databaseService.getDocumentById({ id });

      if (!document) {
        return {
          error: "Document not found",
        };
      }

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

      const documentHandler = handlers.find(
        (handler) => handler.kind === document.kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        memberId,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: "The document has been updated successfully.",
      };
    },
  });
