import { memo } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { XIcon } from "@workspace/icons/lucide";
import { Button } from "@workspace/ui/components/button";

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact();

  return (
    <Button
      className="h-fit p-2 dark:hover:bg-zinc-700"
      data-testid="artifact-close-button"
      onClick={() => {
        setArtifact((currentArtifact) =>
          currentArtifact.status === "streaming"
            ? {
                ...currentArtifact,
                isVisible: false,
              }
            : { ...initialArtifactData, status: "idle" }
        );
      }}
      variant="outline"
    >
      <XIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
