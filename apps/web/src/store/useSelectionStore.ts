import { create } from 'zustand';
import { BoundingBox } from '@canvasync/shared';

interface SelectionState {
  selectedIds: Set<string>;
  selectionBox: BoundingBox | null;
  
  setSelectedIds: (ids: string[] | Set<string>) => void;
  setSelectionBox: (box: BoundingBox | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: new Set(),
  selectionBox: null,

  setSelectedIds: (ids) =>
    set({
      selectedIds: ids instanceof Set ? ids : new Set(ids),
    }),

  setSelectionBox: (box) => set({ selectionBox: box }),

  clearSelection: () => set({ selectedIds: new Set(), selectionBox: null }),
}));
