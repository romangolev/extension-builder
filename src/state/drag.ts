import type { DragEvent } from "react";
import { create } from "zustand";
import type { DropTarget } from "../domain/rules";
import { useStore } from "./store";

interface DragState {
  draggedId: string | null;
  overKey: string | null;
}

export const useDrag = create<DragState>(() => ({ draggedId: null, overKey: null }));

export function targetKey(target: DropTarget): string {
  return target.kind === "panel" ? `panel:${target.panelId}` : `element:${target.elementId}`;
}

export function dragSourceProps(elementId: string) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", elementId);
      useDrag.setState({ draggedId: elementId });
    },
    onDragEnd: () => useDrag.setState({ draggedId: null, overKey: null }),
  };
}

/**
 * The innermost drop target wins: each handler stops propagation, so a stack
 * inside a panel claims the drop before the panel does.
 */
export function dropTargetProps(target: DropTarget) {
  const key = targetKey(target);
  return {
    onDragOver: (e: DragEvent) => {
      if (!useDrag.getState().draggedId) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      if (useDrag.getState().overKey !== key) useDrag.setState({ overKey: key });
    },
    onDrop: (e: DragEvent) => {
      const { draggedId } = useDrag.getState();
      useDrag.setState({ draggedId: null, overKey: null });
      if (!draggedId) return;
      e.preventDefault();
      e.stopPropagation();
      const reason = useStore.getState().moveElement(draggedId, target);
      if (reason) window.alert(reason);
    },
  };
}

export function useIsDragOver(target: DropTarget): boolean {
  const key = targetKey(target);
  return useDrag((s) => s.overKey === key);
}

export function useIsDragging(elementId: string): boolean {
  return useDrag((s) => s.draggedId === elementId);
}
