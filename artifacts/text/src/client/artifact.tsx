import { toast } from "sonner";
import { Artifact } from "@workspace/artifact";
import { DiffView } from "./components/diffview";
import { TextEditor } from "./components/text-editor";
import {
  RotateCcwIcon,
  CopyIcon,
  MessageSquareIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from "@workspace/icons/lucide";
import type { DBSuggestion } from "@workspace/database/types";

type TextArtifactMetadata = {
  suggestions: DBSuggestion[];
};

export const textArtifact = new Artifact<"text", TextArtifactMetadata>({
  kind: "text",
  description: "Useful for text content, like drafting essays and emails.",
  initialize: async ({ documentId, setMetadata }) => {
    const suggestionsResponse = await fetch(
      `/api/suggestions?documentId=${documentId}`
    );
    const suggestions = (await suggestionsResponse.json()) as DBSuggestion[];

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === "data-suggestion") {
      setMetadata((metadata) => {
        return {
          suggestions: [...metadata.suggestions, streamPart.data],
        };
      });
    }

    if (streamPart.type === "data-textDelta") {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + streamPart.data,
          isVisible:
            draftArtifact.status === "streaming" &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
          status: "streaming",
        };
      });
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return (
        <div className="flex w-full flex-col gap-4">
          <div className="h-12 w-1/2 animate-pulse rounded-lg bg-muted-foreground/20" />
          <div className="h-5 w-full animate-pulse rounded-lg bg-muted-foreground/20" />
          <div className="h-5 w-full animate-pulse rounded-lg bg-muted-foreground/20" />
          <div className="h-5 w-1/3 animate-pulse rounded-lg bg-muted-foreground/20" />
          <div className="h-5 w-52 animate-pulse rounded-lg bg-transparent" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-muted-foreground/20" />
          <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted-foreground/20" />
        </div>
      );
    }

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView newContent={newContent} oldContent={oldContent} />;
    }

    return (
      <div className="flex flex-row px-4 py-8 md:p-20">
        <TextEditor
          content={content}
          currentVersionIndex={currentVersionIndex}
          isCurrentVersion={isCurrentVersion}
          onSaveContent={onSaveContent}
          status={status}
          suggestions={metadata ? metadata.suggestions : []}
        />

        {metadata?.suggestions && metadata.suggestions.length > 0 ? (
          <div className="h-dvh w-12 shrink-0 md:hidden" />
        ) : null}
      </div>
    );
  },
  actions: [
    {
      icon: <RotateCcwIcon size={18} />,
      description: "View changes",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("toggle");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: "Add final polish",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.",
            },
          ],
        });
      },
    },
    {
      icon: <MessageSquareIcon />,
      description: "Request suggestions",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please add suggestions you have that could improve the writing.",
            },
          ],
        });
      },
    },
  ],
});
