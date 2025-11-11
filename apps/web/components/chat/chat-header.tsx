"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { MessageSquareIcon } from "@workspace/icons/lucide";
import { NavHistory } from "../nav-history";

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

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <MessageSquareIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <NavHistory />
        </PopoverContent>
      </Popover>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
