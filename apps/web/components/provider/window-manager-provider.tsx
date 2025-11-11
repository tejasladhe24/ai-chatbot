"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { UIArtifact } from "@workspace/artifact";
import { Dock, type DockItem } from "../dock";
import {
  FileIcon,
  ImageIcon,
  Code2Icon,
  Table2Icon,
} from "@workspace/icons/lucide";
import type { DBArtifactKind } from "@workspace/database/types";

export type WindowState = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  artifactData?: UIArtifact;
};

type WindowManagerContextType = {
  windows: Map<string, WindowState>;
  createWindow: (
    id: string,
    defaultBounds?: Partial<WindowState>,
    artifactData?: UIArtifact
  ) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  getTopZIndex: () => number;
  getArtifactWindows: () => Map<string, WindowState>;
};

const WindowManagerContext = createContext<
  WindowManagerContextType | undefined
>(undefined);

export function WindowManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windows, setWindows] = useState<Map<string, WindowState>>(new Map());
  const [topZIndex, setTopZIndex] = useState(1000);

  const createWindow = useCallback(
    (
      id: string,
      defaultBounds?: Partial<WindowState>,
      artifactData?: UIArtifact
    ) => {
      setTopZIndex((z) => {
        const newZIndex = z + 1;

        setWindows((prev) => {
          if (prev.has(id)) {
            // Update existing window with new artifact data if provided
            const existing = prev.get(id);
            if (existing && artifactData) {
              const newMap = new Map(prev);
              newMap.set(id, { ...existing, artifactData, ...defaultBounds });
              return newMap;
            }
            return prev;
          }

          const newWindow: WindowState = {
            id,
            x: defaultBounds?.x ?? 100 + prev.size * 30,
            y: defaultBounds?.y ?? 100 + prev.size * 30,
            width: defaultBounds?.width ?? 720,
            height: defaultBounds?.height ?? 540,
            zIndex: newZIndex,
            isMinimized: false,
            artifactData,
            ...defaultBounds,
          };

          const newMap = new Map(prev);
          newMap.set(id, newWindow);
          return newMap;
        });

        return newZIndex;
      });
    },
    []
  );

  const updateWindow = useCallback(
    (id: string, updates: Partial<WindowState>) => {
      setWindows((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(id);
        if (existing) {
          newMap.set(id, { ...existing, ...updates });
        }
        return newMap;
      });
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      setTopZIndex((z) => {
        const newZIndex = z + 1;
        updateWindow(id, { zIndex: newZIndex, isMinimized: false });
        return newZIndex;
      });
    },
    [updateWindow]
  );

  const getTopZIndex = useCallback(() => topZIndex, [topZIndex]);

  const getArtifactWindows = useCallback(() => {
    const artifactWindows = new Map<string, WindowState>();
    windows.forEach((window, id) => {
      if (window.artifactData) {
        artifactWindows.set(id, window);
      }
    });
    return artifactWindows;
  }, [windows]);

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

  const dockItems = useMemo<DockItem[]>(() => {
    const items: DockItem[] = [];
    const sortedWindows = Array.from(windows.values()).sort(
      (a, b) => b.zIndex - a.zIndex
    );

    sortedWindows.forEach((window) => {
      if (window.artifactData) {
        items.push({
          id: window.id,
          label: window.artifactData.title || "Untitled Document",
          icon: getArtifactIcon(window.artifactData.kind),
          onClick: () => {
            focusWindow(window.id);
          },
          isActive: !window.isMinimized,
        });
      }
    });

    return items;
  }, [windows, focusWindow]);

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        createWindow,
        updateWindow,
        closeWindow,
        focusWindow,
        getTopZIndex,
        getArtifactWindows,
      }}
    >
      <>
        <Dock items={dockItems} />
        {children}
      </>
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error(
      "useWindowManager must be used within WindowManagerProvider"
    );
  }
  return context;
}
