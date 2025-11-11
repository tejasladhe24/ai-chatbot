"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@workspace/ui/components/button";

function PureChatHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2 border-b">
      <Button
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
        variant="ghost"
      >
        Axon
      </Button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
