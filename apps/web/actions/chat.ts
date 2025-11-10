"use server";

import { cookies } from "next/headers";
import {
  generateText,
  myProvider,
  titlePrompt,
  UIMessage,
} from "@workspace/ai";
import { getTextFromMessage } from "@/lib/utils";
import { databaseService } from "@/lib/db";
import { DBVisibility } from "@workspace/database/types";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const message = await databaseService.getMessageById({ id });

  if (!message) {
    return;
  }

  await databaseService.deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: DBVisibility;
}) {
  await databaseService.updateChatVisibilityById({ chatId, visibility });
}
