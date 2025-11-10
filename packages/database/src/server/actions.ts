"use server";

import { DatabaseService } from "./db";

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  const { container } = await import("@workspace/di");

  const databaseService = container.resolve<DatabaseService>("db");

  if (!databaseService) {
    throw new Error("Database service not found");
  }

  const chat = await databaseService.updateChatVisibilityById({
    chatId,
    visibility,
  });

  return chat;
}
