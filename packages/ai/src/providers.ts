import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

export const myProvider: ReturnType<typeof customProvider> = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("openai/gpt-4o-mini"),
    "chat-model-reasoning": wrapLanguageModel({
      model: gateway.languageModel("openai/o3-mini"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": gateway.languageModel("openai/gpt-3.5-turbo"),
    "artifact-model": gateway.languageModel("openai/gpt-4o"),
  },
});
