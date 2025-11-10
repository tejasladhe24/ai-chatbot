"use client";

import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { DBChat, DBVisibility } from "@workspace/database/types";
import {
  getPaginationKey,
  type PaginatedHistory,
} from "@workspace/database/common";
import { updateChatVisibility } from "@/actions/chat";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: DBVisibility;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: PaginatedHistory<DBChat> = cache.get("/api/history")?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    }
  );

  const visibilityType = useMemo(() => {
    if (!history) {
      return localVisibility;
    }
    const chat = history.items.find((currentChat) => currentChat.id === chatId);
    if (!chat) {
      return "private";
    }
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: DBVisibility) => {
    setLocalVisibility(updatedVisibilityType);
    mutate(unstable_serialize(getPaginationKey<DBChat>(`/api/history`)));

    updateChatVisibility({
      chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
