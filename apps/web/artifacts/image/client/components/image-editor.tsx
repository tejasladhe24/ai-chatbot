"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { LoaderIcon } from "@workspace/icons/lucide";

type ImageEditorProps = {
  title: string;
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
};

export function ImageEditor({
  title,
  content,
  status,
  isInline,
}: ImageEditorProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-center",
        isInline ? "h-[200px]" : "h-[calc(100dvh-60px)]"
      )}
    >
      {status === "streaming" ? (
        <div className="flex flex-row items-center gap-4">
          {!isInline && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
          <div>Generating Image...</div>
        </div>
      ) : (
        <picture>
          {/** biome-ignore lint/nursery/useImageSize: "Generated image without explicit size" */}
          <img
            alt={title}
            className={cn("h-fit w-full max-w-[800px]", {
              "p-0 md:p-20": !isInline,
            })}
            src={`data:image/png;base64,${content}`}
          />
        </picture>
      )}
    </div>
  );
}
