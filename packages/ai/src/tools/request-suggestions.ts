import { Provider, streamObject, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { type DBSuggestion } from "@workspace/database/types";
import { DatabaseService } from "@workspace/database/server";
import { ChatMessage } from "@/types";
import { nanoid } from "nanoid";
import { container } from "@workspace/di";

type RequestSuggestionsProps = {
  memberId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const requestSuggestions = ({
  memberId,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description: "Request suggestions for a document",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
    }),
    execute: async ({ documentId }) => {
      const databaseService = container.resolve<DatabaseService>("db");

      const document = await databaseService.getDocumentById({
        id: documentId,
      });

      if (!document || !document.content) {
        return {
          error: "Document not found",
        };
      }

      const suggestions: Omit<
        DBSuggestion,
        "memberId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const myProvider = container.resolve<Provider>("myProvider");

      const { elementStream } = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
        prompt: document.content,
        output: "array",
        schema: z.object({
          originalSentence: z.string().describe("The original sentence"),
          suggestedSentence: z.string().describe("The suggested sentence"),
          description: z.string().describe("The description of the suggestion"),
        }),
      });

      for await (const element of elementStream) {
        // @ts-expect-error todo: fix type
        const suggestion: DBSuggestion = {
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          id: nanoid(),
          documentId,
          isResolved: false,
        };

        dataStream.write({
          type: "data-suggestion",
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      if (memberId) {
        await databaseService.saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            memberId,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Suggestions have been added to the document",
      };
    },
  });
