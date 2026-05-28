import { create } from 'zustand';
import { StrokeStyle, ToolName } from '@canvasync/shared';
import * as DEFAULTS from '@canvasync/shared';

interface StyleState {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  strokeStyle: StrokeStyle;
  
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setStrokeStyle: (style: StrokeStyle) => void;
}

export const useStyleStore = create<StyleState>((set) => ({
  strokeColor: DEFAULTS.DEFAULT_STROKE_COLOR,
  fillColor: DEFAULTS.DEFAULT_FILL_COLOR,
  strokeWidth: DEFAULTS.DEFAULT_STROKE_WIDTH,
  opacity: DEFAULTS.DEFAULT_OPACITY,
  strokeStyle: DEFAULTS.DEFAULT_STROKE_STYLE,

  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setOpacity: (opacity) => set({ opacity }),
  setStrokeStyle: (strokeStyle) => set({ strokeStyle }),
}));
