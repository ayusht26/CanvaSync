import { create } from 'zustand';
import { Shape } from '@canvasync/shared';
import { nanoid } from 'nanoid';

interface ShapeState {
  elements: Shape[];
  
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  duplicateShape: (id: string) => void;
  setElements: (elements: Shape[]) => void;
}

export const useShapeStore = create<ShapeState>((set) => ({
  elements: [],

  addShape: (shape) =>
    set((state) => ({
      elements: [...state.elements, shape],
    })),

  updateShape: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } as Shape : el
      ),
    })),

  removeShape: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),

  duplicateShape: (id: string) =>
    set((state) => {
      const shape = state.elements.find((e) => e.id === id);
      if (!shape) return state;
      const copy = { ...shape, id: nanoid(), x: shape.x + 20, y: shape.y + 20, createdAt: Date.now(), updatedAt: Date.now() };
      return { elements: [...state.elements, copy as Shape] };
    }),

  setElements: (elements) => set({ elements }),
}));
