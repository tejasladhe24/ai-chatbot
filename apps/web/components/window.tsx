"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Rnd } from "react-rnd";
import { XIcon, MinusIcon } from "@workspace/icons/lucide";
import { Button } from "@workspace/ui/components/button";
import {
  useWindowManager,
  type WindowState,
} from "./provider/window-manager-provider";
import { useEffect } from "react";

type WindowProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultBounds?: Partial<WindowState>;
  onClose?: () => void;
};

export function Window({
  id,
  title,
  children,
  defaultBounds,
  onClose,
}: WindowProps) {
  const { windows, createWindow, updateWindow, closeWindow, focusWindow } =
    useWindowManager();
  const windowState = windows.get(id);

  useEffect(() => {
    if (!windowState) {
      createWindow(id, defaultBounds);
    }
  }, [id, windowState, createWindow, defaultBounds]);

  if (!windowState) {
    return null;
  }

  const handleDragStop = (_: any, d: { x: number; y: number }) => {
    updateWindow(id, { x: d.x, y: d.y });
  };

  const handleResizeStop = (
    _: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    updateWindow(id, {
      width: ref.offsetWidth,
      height: ref.offsetHeight,
      x: position.x,
      y: position.y,
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closeWindow(id);
  };

  const handleMinimize = () => {
    updateWindow(id, { isMinimized: !windowState.isMinimized });
  };

  const handleFocus = () => {
    focusWindow(id);
  };

  if (windowState.isMinimized) {
    return (
      <div
        className="fixed bg-background border rounded-t-lg shadow-lg cursor-pointer"
        style={{
          left: windowState.x,
          top: windowState.y,
          width: 200,
          height: 30,
          zIndex: windowState.zIndex,
        }}
        onClick={handleFocus}
      >
        <div className="flex items-center justify-between px-2 h-full">
          <span className="text-sm truncate">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <Rnd
      size={{ width: windowState.width, height: windowState.height }}
      position={{ x: windowState.x, y: windowState.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={400}
      minHeight={300}
      bounds="window"
      style={{ zIndex: windowState.zIndex }}
      dragHandleClassName="cursor-move"
    >
      <Card className="h-full w-full flex flex-col p-0 gap-0 shadow-lg">
        <CardHeader
          className="flex flex-row items-center justify-between p-2 cursor-move border-b"
          onMouseDown={handleFocus}
        >
          <CardTitle className="text-sm font-medium truncate flex-1">
            {title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
            >
              <MinusIcon size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <XIcon size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-auto">
          {children}
        </CardContent>
      </Card>
    </Rnd>
  );
}
