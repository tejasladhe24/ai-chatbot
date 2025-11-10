import type { InferUITool, UIMessage, UIMessageStreamWriter } from "ai";
import type {
  DBArtifactKind,
  DBDocument,
  DBSuggestion,
} from "@workspace/database/types";
import { z } from "zod";
import type { createDocument } from "./tools/create-document";
import type { getWeather } from "./tools/get-weather";
import type { requestSuggestions } from "./tools/request-suggestions";
import type { updateDocument } from "./tools/update-document";
import { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: DBSuggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: DBArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

export type SaveDocumentProps = {
  id: string;
  title: string;
  kind: DBArtifactKind;
  content: string;
  memberId: string;
};

export type CreateDocumentCallbackProps = {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  memberId: string;
};

export type UpdateDocumentCallbackProps = {
  document: DBDocument;
  description: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  memberId: string;
};

export type DocumentHandler<T = DBArtifactKind> = {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
};
