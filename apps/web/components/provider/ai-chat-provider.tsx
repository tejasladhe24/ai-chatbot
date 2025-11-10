"use client";

import { fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import {
  AppUsage,
  ChatMessage,
  ChatStatus,
  DataUIPart,
  CustomUIDataTypes,
  DefaultChatTransport,
  Attachment,
  DEFAULT_CHAT_MODEL,
} from "@workspace/ai";
import type { DBChat, DBVisibility } from "@workspace/database/types";
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import { toast } from "sonner";
import { mutate, unstable_serialize } from "swr";
import { getPaginationKey } from "@workspace/database/common";
import { artifactDefinitions } from "@/artifacts/artifact-definitions";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";

interface IAIChatContext {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  model: string;
  setModel: (model: string) => void;
  isReadonly: boolean;
  visibilityType: DBVisibility;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: ChatStatus;
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
  usage: AppUsage | undefined;
  setUsage: Dispatch<SetStateAction<AppUsage | undefined>>;
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}

const AIChatContext = createContext<IAIChatContext>({
  chatId: generateUUID(),
  setInput: () => {},
  input: "",
  model: "",
  setModel: () => {},
  isReadonly: false,
  visibilityType: "private",
  messages: [],
  setMessages: () => {},
  sendMessage: async () => {
    return;
  },
  status: "idle" as ChatStatus,
  stop: async () => {
    return;
  },
  regenerate: async () => {
    return;
  },
  resumeStream: async () => {
    return;
  },
  usage: undefined,
  setUsage: () => {},
  dataStream: [],
  setDataStream: () => {},
  attachments: [],
  setAttachments: () => {},
});

export function useAIChatContext() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error("useAIChatContext must be used within a AIChatContext");
  }
  return context;
}

interface AIChatProviderProps {
  children: React.ReactNode;
  chatId?: string;
  initialChatModel?: string;
  initialLastContext?: AppUsage;
  initialVisibilityType?: DBVisibility;
  initialMessages?: ChatMessage[];
  initialIsReadonly?: boolean;
}

export const AIChatProvider = ({
  children,
  chatId = generateUUID(),
  initialChatModel = DEFAULT_CHAT_MODEL,
  initialLastContext = undefined,
  initialVisibilityType = "private",
  initialMessages = [],
  initialIsReadonly = false,
}: AIChatProviderProps) => {
  const [input, setInput] = useLocalStorage("input", "");
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [currentModel, setCurrentModel] = useLocalStorage(
    "model",
    initialChatModel
  );
  const currentModelRef = useRef(currentModel);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelRef.current,
            selectedVisibilityType: initialVisibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      const paginationKey = getPaginationKey<DBChat>(`/api/history`);

      mutate(unstable_serialize(paginationKey));
    },
    onError: (error) => {
      if (error instanceof Error) {
        // Check if it's a credit card error
        toast.error(`${error}`);
      }
    },
  });

  useEffect(() => {
    currentModelRef.current = currentModel;
  }, [currentModel]);

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) =>
          currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: "streaming",
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data,
              status: "streaming",
            };

          case "data-kind":
            return {
              ...draftArtifact,
              kind: delta.data,
              status: "streaming",
            };

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "data-finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          default:
            return draftArtifact;
        }
      });
    }
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return (
    <AIChatContext.Provider
      value={{
        chatId,
        input,
        setInput,
        model: currentModel,
        setModel: setCurrentModel,
        isReadonly: initialIsReadonly,
        visibilityType: initialVisibilityType,
        messages,
        setMessages,
        sendMessage,
        status,
        stop,
        regenerate,
        resumeStream,
        usage,
        setUsage,
        dataStream,
        setDataStream,
        attachments,
        setAttachments,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};
