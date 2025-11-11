"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { formatDistance } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback } from "usehooks-ts";
import { fetcher } from "@/lib/utils";
import { ArtifactActions } from "./artifact-actions";
import { Toolbar } from "./toolbar";
import { VersionFooter } from "./version-footer";
import { DBDocument } from "@workspace/database/types";
import { ChatMessage } from "@workspace/ai";
import { artifactDefinitions } from "@/artifacts/artifact-definitions";
import { Window } from "../window";
import { useWindowManager } from "../provider/window-manager-provider";
import type { UIArtifact } from "@workspace/artifact";

type ArtifactWindowProps = {
  windowId: string;
  artifact: UIArtifact;
  status?: UseChatHelpers<ChatMessage>["status"];
  stop?: UseChatHelpers<ChatMessage>["stop"];
  sendMessage?: UseChatHelpers<ChatMessage>["sendMessage"];
  setMessages?: UseChatHelpers<ChatMessage>["setMessages"];
};

function PureArtifactWindow({
  windowId,
  artifact,
  status,
  stop,
  sendMessage,
  setMessages,
}: ArtifactWindowProps) {
  const { windows, closeWindow, updateWindow } = useWindowManager();
  const windowState = windows.get(windowId);

  // Use artifact from window state if available, otherwise use prop
  const currentArtifact = windowState?.artifactData ?? artifact;

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<DBDocument[]>(
    currentArtifact.documentId !== "init" &&
      currentArtifact.status !== "streaming"
      ? `/api/document/${currentArtifact.documentId}`
      : null,
    fetcher
  );

  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<DBDocument | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        const newContent = mostRecentDocument.content ?? "";
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);

        // Only update window if content is different to avoid infinite loops
        const windowState = windows.get(windowId);
        if (
          windowState?.artifactData &&
          windowState.artifactData.content !== newContent
        ) {
          updateWindow(windowId, {
            artifactData: {
              ...windowState.artifactData,
              content: newContent,
            },
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  useEffect(() => {
    mutateDocuments();
  }, [mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!currentArtifact) {
        return;
      }

      mutate<DBDocument[]>(
        `/api/document/${currentArtifact.documentId}`,
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
            await fetch(`/api/document/${currentArtifact.documentId}`, {
              method: "POST",
              body: JSON.stringify({
                title: currentArtifact.title,
                content: updatedContent,
                kind: currentArtifact.kind,
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
    [currentArtifact, mutate]
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

  useEffect(() => {
    if (
      currentArtifact.documentId !== "init" &&
      artifactDefinition.initialize
    ) {
      artifactDefinition.initialize({
        documentId: currentArtifact.documentId,
        setMetadata,
      });
    }
  }, [currentArtifact.documentId, artifactDefinition]);

  if (!windowState || currentArtifact.documentId === "init") {
    return null;
  }

  const handleClose = () => {
    closeWindow(windowId);
  };

  return (
    <Window
      id={windowId}
      title={currentArtifact.title || "Untitled Document"}
      onClose={handleClose}
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
            artifact={currentArtifact}
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
                ? (document?.content ?? currentArtifact.content ?? "")
                : getDocumentContentById(currentVersionIndex)
            }
            currentVersionIndex={currentVersionIndex}
            getDocumentContentById={getDocumentContentById}
            isCurrentVersion={isCurrentVersion}
            isInline={false}
            isLoading={isDocumentsFetching && !document?.content}
            metadata={metadata}
            mode={mode}
            onSaveContent={saveContent}
            setMetadata={setMetadata}
            status={currentArtifact.status}
            suggestions={[]}
            title={currentArtifact.title}
          />

          <AnimatePresence>
            {isCurrentVersion && sendMessage && (
              <Toolbar
                artifactKind={currentArtifact.kind}
                isToolbarVisible={isToolbarVisible}
                sendMessage={sendMessage}
                setIsToolbarVisible={setIsToolbarVisible}
                setMessages={setMessages!}
                status={status!}
                stop={stop!}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              currentVersionIndex={currentVersionIndex}
              documents={documents || []}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </div>
    </Window>
  );
}

export const ArtifactWindow = memo(PureArtifactWindow);
