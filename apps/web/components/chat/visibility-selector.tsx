"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { GlobeIcon, LockIcon } from "@workspace/icons/lucide";
import type { DBVisibility } from "@workspace/database/types";
import { SwitchWithIcons } from "@workspace/ui/components/shadcn-studio/switch/switch-12";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

const visibilities: Array<{
  id: DBVisibility;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "private",
    label: "Private",
    description: "Only you can access this chat",
    icon: <LockIcon />,
  },
  {
    id: "public",
    label: "Public",
    description: "Anyone with the link can access this chat",
    icon: <GlobeIcon />,
  },
];

export function VisibilitySelector({
  chatId,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: DBVisibility;
} & React.ComponentProps<typeof Button>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType: selectedVisibilityType,
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SwitchWithIcons
              labels={{
                checked: GlobeIcon,
                unchecked: LockIcon,
              }}
              defaultChecked={visibilityType === "public"}
              onCheckedChange={(checked) =>
                setVisibilityType(checked ? "public" : "private")
              }
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            {visibilities.find((v) => v.id === visibilityType)?.description}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
