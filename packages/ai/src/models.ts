export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description?: string;
  reasoning?: boolean;
  chef: string;
  chefSlug: string;
  providers: string[];
};

export const models: ChatModel[] = [
  {
    id: "chat-model",
    name: "OpenAI GPT-4o Mini",
    description: "OpenAI's GPT-4o Mini model",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "chat-model-reasoning",
    name: "OpenAI O3 Mini",
    description: "OpenAI's O3 Mini model",
    reasoning: true,
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
];
