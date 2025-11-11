"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import {
  FileIcon,
  ImageIcon,
  Code2Icon,
  Table2Icon,
} from "@workspace/icons/lucide";
import type { DBArtifactKind } from "@workspace/database/types";

interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  items: DockItem[];
}

export type DockItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
};

const getArtifactIcon = (kind?: DBArtifactKind) => {
  switch (kind) {
    case "image":
      return <ImageIcon size={24} />;
    case "code":
      return <Code2Icon size={24} />;
    case "sheet":
      return <Table2Icon size={24} />;
    case "text":
    default:
      return <FileIcon size={24} />;
  }
};

export const Dock = ({ items, className, ...props }: DockProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div
        onMouseEnter={() => setIsOpen(true)}
        className="fixed left-0 top-0 h-full w-1 bg-transparent z-50"
        aria-label="dock-rail"
      />
      <div
        aria-label="dock"
        className={cn(
          "fixed left-1 top-1/2 -translate-y-1/2 z-50",
          "flex flex-col items-center justify-center p-3 gap-2",
          // "bg-background/80 backdrop-blur-sm border rounded-xl shadow-lg",
          // "transition-transform duration-300",
          // isOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.25rem)]",
          className
        )}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        {...props}
      >
        {items.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={item.isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-12 h-12 aspect-square",
                  "flex flex-col items-center justify-center",
                  item.isActive && "bg-primary/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
              >
                {item.icon || getArtifactIcon()}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-sky-500 text-white [&_.arrow]:bg-sky-500 [&_.arrow]:fill-sky-500"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
