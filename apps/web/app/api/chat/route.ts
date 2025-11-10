import "@/lib/bootstrap";

import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "@workspace/ai";
import { getUsage } from "tokenlens/helpers";
import { auth } from "@/lib/auth";
import type { DBVisibility, DBMessage } from "@workspace/database/types";
import {
  myProvider,
  systemPrompt,
  createDocument,
  getWeather,
  requestSuggestions,
  updateDocument,
  entitlementsByMemberRole,
  type ChatModel,
  type ChatMessage,
  type AppUsage,
} from "@workspace/ai";
import { isProductionEnvironment } from "@/lib/constants";
import { ChatSDKError } from "@/lib/errors";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { headers } from "next/headers";
import { databaseService, db } from "@/lib/db";
import { generateTitleFromUserMessage } from "@/actions/chat";
import { getTokenlensCatalog } from "@/lib/resumable-stream-context";
import { $chat } from "@workspace/database/server";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: DBVisibility;
    } = requestBody;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.session.activeOrganizationId) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const member = await databaseService.getMemberByUserIdAndOrganizationId({
      userId: session.user.id,
      organizationId: session.session.activeOrganizationId,
    });

    if (!member) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const messageCount = await databaseService.getMessageCountByMemberId({
      memberId: member.id,
      differenceInHours: 24,
    });

    if (
      messageCount > entitlementsByMemberRole[member.role].maxMessagesPerDay
    ) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await databaseService.getChatById({ id });
    let messagesFromDb: DBMessage[] = [];

    if (chat) {
      if (chat.memberId !== member.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists
      messagesFromDb = await databaseService.getMessagesByChatId({ id });
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await databaseService.saveChat({
        id,
        memberId: member.id,
        title,
        visibility: selectedVisibilityType,
      });
      // New chat - no need to fetch messages, it's empty
    }

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    await databaseService.saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await databaseService.createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === "chat-model-reasoning"
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "requestSuggestions",
                ],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            getWeather,
            createDocument: createDocument({ memberId: member.id, dataStream }),
            updateDocument: updateDocument({ memberId: member.id, dataStream }),
            requestSuggestions: requestSuggestions({
              memberId: member.id,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await databaseService.saveMessages({
          messages: messages.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            updatedAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalMergedUsage) {
          try {
            await db
              .update($chat)
              .set({ lastContext: finalMergedUsage })
              .where(eq($chat.id, id));
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const member = await databaseService.getMemberByUserIdAndOrganizationId({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
  });

  const chat = await databaseService.getChatById({ id });

  if (!member || chat?.memberId !== member.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await databaseService.deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
