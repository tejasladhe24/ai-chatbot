import type { ChatModel } from "./models";
import { type DBRole } from "@workspace/database/types";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByMemberRole: Record<DBRole, Entitlements> = {
  member: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
  admin: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
  owner: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
};
