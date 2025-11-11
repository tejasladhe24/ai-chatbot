import type { UseChatHelpers } from "@ai-sdk/react";
import { formatDistance } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback } from "usehooks-ts";
import { useArtifact, initialArtifactData } from "@/hooks/use-artifact";
import { fetcher } from "@/lib/utils";
import { ArtifactActions } from "./artifact-actions";
import { Toolbar } from "./toolbar";
import { VersionFooter } from "./version-footer";
import { DBDocument } from "@workspace/database/types";
import { ChatMessage } from "@workspace/ai";
import { artifactDefinitions } from "@/artifacts/artifact-definitions";
import { Window } from "../window";
import { useWindowManager } from "../provider/window-manager-provider";

function PureArtifact({
  status,
  stop,
  sendMessage,
  setMessages,
}: {
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<DBDocument[]>(
    artifact.documentId !== "init" && artifact.status !== "streaming"
      ? `/api/document/${artifact.documentId}`
      : null,
    fetcher
  );

  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<DBDocument | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? "",
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) {
        return;
      }

      mutate<DBDocument[]>(
        `/api/document/${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) {
            return [];
          }

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document/${artifact.documentId}`, {
              method: "POST",
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false }
      );
    },
    [artifact, mutate]
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) {
      return "";
    }
    if (!documents[index]) {
      return "";
    }
    return documents[index].content ?? "";
  }

  const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
    if (!documents) {
      return;
    }

    if (type === "latest") {
      setCurrentVersionIndex(documents.length - 1);
      setMode("edit");
    }

    if (type === "toggle") {
      setMode((currentMode) => (currentMode === "edit" ? "diff" : "edit"));
    }

    if (type === "prev") {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === "next" && currentVersionIndex < documents.length - 1) {
      setCurrentVersionIndex((index) => index + 1);
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  const { createWindow, windows } = useWindowManager();
  const windowId = `artifact-${artifact.documentId}`;

  useEffect(() => {
    if (artifact.documentId !== "init" && artifactDefinition.initialize) {
      artifactDefinition.initialize({
        documentId: artifact.documentId,
        setMetadata,
      });
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  useEffect(() => {
    if (artifact.isVisible && artifact.documentId !== "init") {
      createWindow(windowId, {
        x: artifact.boundingBox.left || 100,
        y: artifact.boundingBox.top || 100,
        width: Math.max(720, artifact.boundingBox.width || 720),
        height: Math.max(540, artifact.boundingBox.height || 540),
      });
    }
  }, [
    artifact.isVisible,
    artifact.documentId,
    windowId,
    createWindow,
    artifact.boundingBox,
  ]);

  if (!artifact.isVisible || artifact.documentId === "init") {
    return null;
  }

  const windowState = windows.get(windowId);
  if (!windowState) {
    return null;
  }

  return (
    <Window
      id={windowId}
      title={artifact.title || "Untitled Document"}
      onClose={() => {
        setArtifact((currentArtifact) =>
          currentArtifact.status === "streaming"
            ? {
                ...currentArtifact,
                isVisible: false,
              }
            : { ...initialArtifactData, status: "idle" }
        );
      }}
    >
      <div className="flex h-full flex-col bg-background">
        <div className="flex flex-row items-start justify-between p-4 border-b">
          <div className="flex flex-row items-start gap-4">
            <div className="flex flex-col">
              {isContentDirty ? (
                <div className="text-muted-foreground text-sm">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-muted-foreground text-sm">
                  {`Updated ${formatDistance(
                    new Date(document.createdAt),
                    new Date(),
                    {
                      addSuffix: true,
                    }
                  )}`}
                </div>
              ) : (
                <div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-muted-foreground/20" />
              )}
            </div>
          </div>

          <ArtifactActions
            artifact={artifact}
            currentVersionIndex={currentVersionIndex}
            handleVersionChange={handleVersionChange}
            isCurrentVersion={isCurrentVersion}
            metadata={metadata}
            mode={mode}
            setMetadata={setMetadata}
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-background dark:bg-muted">
          <artifactDefinition.content
            content={
              isCurrentVersion
                ? artifact.content
                : getDocumentContentById(currentVersionIndex)
            }
            currentVersionIndex={currentVersionIndex}
            getDocumentContentById={getDocumentContentById}
            isCurrentVersion={isCurrentVersion}
            isInline={false}
            isLoading={isDocumentsFetching && !artifact.content}
            metadata={metadata}
            mode={mode}
            onSaveContent={saveContent}
            setMetadata={setMetadata}
            status={artifact.status}
            suggestions={[]}
            title={artifact.title}
          />

          <AnimatePresence>
            {isCurrentVersion && (
              <Toolbar
                artifactKind={artifact.kind}
                isToolbarVisible={isToolbarVisible}
                sendMessage={sendMessage}
                setIsToolbarVisible={setIsToolbarVisible}
                setMessages={setMessages}
                status={status}
                stop={stop}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              currentVersionIndex={currentVersionIndex}
              documents={documents}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </div>
    </Window>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) {
    return false;
  }
  return true;
});
