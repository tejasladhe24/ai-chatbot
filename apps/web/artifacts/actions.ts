"use server";

import { databaseService } from "@/lib/db";

export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await databaseService.getSuggestionsByDocumentId({
    documentId,
  });
  return suggestions ?? [];
}
