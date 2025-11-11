"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useWindowManager } from "../provider/window-manager-provider";
import { ArtifactWindow } from "./artifact-window";
import type { Attachment, ChatMessage } from "@workspace/ai";
import type { DBVisibility, DBVote } from "@workspace/database/types";
import type { Dispatch, SetStateAction } from "react";

type ArtifactWindowsProps = {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  votes: DBVote[] | undefined;
  isReadonly: boolean;
  selectedVisibilityType: DBVisibility;
  selectedModelId: string;
};

export function ArtifactWindows({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  messages,
  setMessages,
  regenerate,
  votes,
  isReadonly,
  selectedVisibilityType,
  selectedModelId,
}: ArtifactWindowsProps) {
  const { getArtifactWindows } = useWindowManager();
  const artifactWindows = getArtifactWindows();

  return (
    <>
      {Array.from(artifactWindows.values()).map((windowState) => {
        if (!windowState.artifactData) {
          return null;
        }

        return (
          <ArtifactWindow
            key={windowState.id}
            windowId={windowState.id}
            artifact={windowState.artifactData}
            chatId={chatId}
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            sendMessage={sendMessage}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            votes={votes}
            isReadonly={isReadonly}
            selectedVisibilityType={selectedVisibilityType}
            selectedModelId={selectedModelId}
          />
        );
      })}
    </>
  );
}

