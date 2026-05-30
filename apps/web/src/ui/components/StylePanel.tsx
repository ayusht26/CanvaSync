import React, { useState } from 'react';
import { useSelectionStore } from '../../store/useSelectionStore.js';
import { useStyleStore } from '../../store/useStyleStore.js';
import { useShapeStore } from '../../store/useShapeStore.js';
import { useCanvasStore } from '../../store/useCanvasStore.js';
import { StrokeStyle, ToolName } from '@canvasync/shared';
import { SceneGraphService } from '../../canvas/SceneGraphService.js';
import { useHistoryStore } from '../../store/useHistoryStore.js';
import { ColorPicker } from '../../components/ui/color-picker.js';
import { Slider } from '../../components/ui/slider.js';
import {
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, Trash2, AlignLeft, AlignCenter, AlignRight, Blend
} from 'lucide-react';

const STROKE_COLORS = [
  'blend', '#09090b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
];

const FILL_COLORS = [
  'transparent', '#09090b', '#fafafa', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7',
];

const STROKE_WIDTHS = [1, 2, 4, 6];
const STROKE_STYLES: { id: StrokeStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dash' },
  { id: 'dotted', label: 'Dot' },
];

const FONT_FAMILIES = [
  { id: 'Noto Sans', label: 'Sans', icon: 'Aa' },
  { id: 'Playwrite GB J', label: 'Hand', icon: 'Gg' },
  { id: 'Cascadia Code', label: 'Code', icon: '<>' },
  { id: 'Roboto', label: 'Roboto', icon: 'Rr' },
];
const FONT_SIZES = [
  { label: 'S', value: 14 },
  { label: 'M', value: 20 },
  { label: 'L', value: 32 },
  { label: 'XL', value: 48 },
];

const ERASER_SIZES = [
  { label: 'S', value: 8 },
  { label: 'M', value: 20 },
  { label: 'L', value: 40 },
  { label: 'XL', value: 80 },
];

const TOOL_LABELS: Record<string, string> = {
  [ToolName.SELECTION]: 'Selection',
  [ToolName.PEN]: 'Pen',
  [ToolName.RECTANGLE]: 'Rectangle',
  [ToolName.ELLIPSE]: 'Ellipse',
  [ToolName.TRIANGLE]: 'Triangle',
  [ToolName.RHOMBUS]: 'Diamond',
  [ToolName.LINE]: 'Line',
  [ToolName.ARROW]: 'Arrow',
  [ToolName.TEXT]: 'Text',
  [ToolName.ERASER]: 'Eraser',
};

interface StylePanelProps {
  sceneGraph?: any;
}

export const StylePanel: React.FC<StylePanelProps> = ({ sceneGraph }) => {
  const { selectedIds } = useSelectionStore();
  const { 
    strokeColor, setStrokeColor, 
    fillColor, setFillColor, 
    strokeWidth, setStrokeWidth, 
    opacity, setOpacity, 
    strokeStyle, setStrokeStyle,
    arrowLineStyle, setArrowLineStyle,
    arrowStartHead, setArrowStartHead,
    arrowEndHead, setArrowEndHead,
  } = useStyleStore();
  const { updateShape, removeShape } = useShapeStore();
  const elements = useShapeStore(state => state.elements);
  const { activeTool } = useCanvasStore();

  const [fontFamily, setFontFamilyState] = useState(() => {
    const defaultFont = 'Playwrite GB J';
    if (typeof window !== 'undefined' && !(window as any).__textFontFamily) {
      (window as any).__textFontFamily = defaultFont;
    }
    return defaultFont;
  });
  const [fontSize, setFontSizeState] = useState(20);
  const [textAlign, setTextAlignState] = useState<'left'|'center'|'right'>('left');

  const [eraserMode, setEraserModeState] = useState<'element' | 'partial'>('element');
  const [eraserSize, setEraserSizeState] = useState(20);

  const setFontFamily = (f: string) => {
    setFontFamilyState(f);
    (window as any).__textFontFamily = f;
    const sg = SceneGraphService.get();
    if (sg) {
      useHistoryStore.getState().recordState(sg.getElements());
      selectedIds.forEach(id => sg.update(id, { fontFamily: f } as any));
    } else {
      selectedIds.forEach(id => updateShape(id, { fontFamily: f } as any));
    }
  };
  const setFontSize = (s: number) => {
    setFontSizeState(s);
    (window as any).__textFontSize = s;
    const sg = SceneGraphService.get();
    if (sg) {
      useHistoryStore.getState().recordState(sg.getElements());
      selectedIds.forEach(id => sg.update(id, { fontSize: s } as any));
    } else {
      selectedIds.forEach(id => updateShape(id, { fontSize: s } as any));
    }
  };
  const setTextAlign = (a: 'left'|'center'|'right') => {
    setTextAlignState(a);
    (window as any).__textAlign = a;
    const sg = SceneGraphService.get();
    if (sg) {
      useHistoryStore.getState().recordState(sg.getElements());
      selectedIds.forEach(id => sg.update(id, { textAlign: a } as any));
    } else {
      selectedIds.forEach(id => updateShape(id, { textAlign: a } as any));
    }
  };

  const setEraserMode = (m: 'element'|'partial') => {
    setEraserModeState(m);
    (window as any).__eraserMode = m;
  };
  const setEraserSize = (s: number) => {
    setEraserSizeState(s);
    (window as any).__eraserSize = s;
  };

  const SHAPE_TOOLS = [ToolName.RECTANGLE, ToolName.ELLIPSE, ToolName.TRIANGLE, ToolName.RHOMBUS];
  const DRAW_TOOLS = [ToolName.PEN, ToolName.LINE, ToolName.ARROW];
  
  const hasSelectedImage = selectedIds.size > 0 && elements
    .some(el => selectedIds.has(el.id) && el.type === 'image');

  const isSelectionToolActive = activeTool === ToolName.SELECTION;
  const isVisible = 
    !hasSelectedImage && (
      (isSelectionToolActive && selectedIds.size > 0) ||          
      SHAPE_TOOLS.includes(activeTool as any) ||                  
      DRAW_TOOLS.includes(activeTool as any) ||                   
      activeTool === ToolName.TEXT ||                             
      activeTool === ToolName.ERASER
    );                             

  const areAllSelectedNonFillable = selectedIds.size > 0 && elements
    .filter(el => selectedIds.has(el.id))
    .every(el => el.type === 'line' || el.type === 'arrow' || el.type === 'pen');

  const showFill = SHAPE_TOOLS.includes(activeTool as any) || 
    (isSelectionToolActive && selectedIds.size > 0 && !areAllSelectedNonFillable);

  const isTextContext = activeTool === ToolName.TEXT || 
    (selectedIds.size > 0 && elements.find(el => selectedIds.has(el.id) && el.type === 'text'));

  if (!isVisible) return null;

  const applyStyle = (updates: Record<string, any>) => {
    if (updates.strokeColor !== undefined) setStrokeColor(updates.strokeColor);
    if (updates.fillColor !== undefined) setFillColor(updates.fillColor);
    if (updates.strokeWidth !== undefined) setStrokeWidth(updates.strokeWidth);
    if (updates.opacity !== undefined) setOpacity(updates.opacity);
    if (updates.strokeStyle !== undefined) setStrokeStyle(updates.strokeStyle);
    // Route updates through SceneGraph (source of truth) for selected shapes
    const sg = SceneGraphService.get();
    if (sg) {
      if (selectedIds.size > 0) {
        useHistoryStore.getState().recordState(sg.getElements());
      }
      selectedIds.forEach((id) => {
        sg.update(id, updates as any);
      });
    } else {
      selectedIds.forEach((id) => {
        updateShape(id, updates as any);
      });
    }
  };

  const deleteSelected = () => {
    const sg = SceneGraphService.get();
    if (sg) {
      useHistoryStore.getState().recordState(sg.getElements());
      selectedIds.forEach((id) => {
        sg.remove(id);
      });
    } else {
      selectedIds.forEach((id) => {
        removeShape(id);
      });
    }
    useSelectionStore.getState().clearSelection();
  };

  const selectedId = Array.from(selectedIds)[0];

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
      {children}
    </div>
  );

  const ColorSwatch = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-lg transition-all duration-100 active:scale-90 relative flex items-center justify-center"
      style={{
        background: color === 'transparent'
          ? undefined
          : color === 'blend'
            ? 'var(--bg-elevated)'
            : color,
        border: selected ? '2px solid var(--text-primary)' : '1.5px solid var(--border)',
        transform: selected ? 'scale(1.12)' : undefined,
        boxShadow: selected ? '0 0 0 2px var(--bg-surface)' : undefined,
      }}
      title={color === 'blend' ? 'Adaptive Blend Ink' : undefined}
    >
      {color === 'transparent' && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="w-full h-full" style={{
            background: 'repeating-linear-gradient(45deg, #ccc 0px, #ccc 2px, transparent 2px, transparent 6px)',
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[70%] h-px rotate-45" style={{ background: '#ef4444' }} />
          </div>
        </div>
      )}
      {color === 'blend' && (
        <Blend size={14} className="text-[var(--text-primary)]" />
      )}
    </button>
  );

  return (
    <div
      className="fixed right-3 z-40 w-56 rounded-2xl overflow-hidden animate-slide-right no-scrollbar"
      style={{
        top: '54px',
        background: 'var(--toolbar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
        cursor: 'default',
        pointerEvents: 'all'
      }}
      onPointerDown={e => e.stopPropagation()}
      onPointerMove={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
    >
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[11px] font-bold uppercase tracking-widest" 
          style={{ color: 'var(--accent)' }}>
          {TOOL_LABELS[activeTool] || activeTool}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {activeTool === ToolName.ERASER ? (
          <>
            <section>
              <SectionLabel>Eraser Type</SectionLabel>
              <div className="space-y-1">
                {[
                  { id: 'element', label: 'Whole Element', desc: 'Removes the full shape' },
                  { id: 'partial', label: 'Partial', desc: 'Erases only covered area' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setEraserMode(opt.id as any)}
                    className="w-full text-left p-2.5 rounded-xl transition-all"
                    style={{
                      background: eraserMode === opt.id ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${eraserMode === opt.id ? 'var(--accent)' : 'transparent'}`,
                    }}>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Size</SectionLabel>
              <div className="flex gap-1">
                {ERASER_SIZES.map(s => (
                  <button key={s.label} onClick={() => setEraserSize(s.value)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: eraserSize === s.value ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: eraserSize === s.value ? '#fff' : 'var(--text-secondary)',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : isTextContext ? (
          <>
            <section>
              <SectionLabel>Font</SectionLabel>
              <div className="grid grid-cols-4 gap-1">
                {FONT_FAMILIES.map(f => (
                  <button key={f.id} onClick={() => setFontFamily(f.id)}
                    className="flex flex-col items-center py-1.5 rounded-lg text-[10px] gap-0.5 transition-all"
                    style={{
                      background: fontFamily === f.id ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: fontFamily === f.id ? '#fff' : 'var(--text-secondary)',
                      fontFamily: f.id === 'Playwrite GB J' ? "'Playwrite GB J', cursive" 
                                 : f.id === 'Cascadia Code' ? "'Cascadia Code', monospace" 
                                 : undefined,
                    }}>
                    <span className="text-sm font-bold">{f.icon}</span>
                    <span className="text-[9px]">{f.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Size</SectionLabel>
              <div className="flex gap-1">
                {FONT_SIZES.map(s => (
                  <button key={s.label} onClick={() => setFontSize(s.value)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: fontSize === s.value ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: fontSize === s.value ? '#fff' : 'var(--text-secondary)',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Align</SectionLabel>
              <div className="flex gap-1">
                {[
                  { v: 'left', Icon: AlignLeft },
                  { v: 'center', Icon: AlignCenter },
                  { v: 'right', Icon: AlignRight },
                ].map(({ v, Icon }) => (
                  <button key={v} onClick={() => setTextAlign(v as any)}
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all"
                    style={{
                      background: textAlign === v ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: textAlign === v ? '#fff' : 'var(--text-secondary)',
                    }}>
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Color</SectionLabel>
              <div className="grid grid-cols-5 gap-1.5">
                {STROKE_COLORS.map(c => (
                  <ColorSwatch key={c} color={c} selected={strokeColor === c}
                    onClick={() => applyStyle({ strokeColor: c, textColor: c })} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section>
              <SectionLabel>Stroke</SectionLabel>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {STROKE_COLORS.map((c) => (
                  <ColorSwatch key={c} color={c} selected={strokeColor === c} onClick={() => applyStyle({ strokeColor: c })} />
                ))}
              </div>
              {/* Full color picker (positioned bottom-start to avoid top-left popup) */}
              <ColorPicker
                value={strokeColor.startsWith('#') ? strokeColor as `#${string}` : '#000000'}
                side="left"
                align="start"
                onValueChange={({ hex }) => applyStyle({ strokeColor: hex })}
              />
            </section>

            {showFill && (
              <section>
                <SectionLabel>Fill</SectionLabel>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {FILL_COLORS.map((c) => (
                    <ColorSwatch key={c} color={c} selected={fillColor === c} onClick={() => applyStyle({ fillColor: c })} />
                  ))}
                </div>
                {fillColor !== 'transparent' && (
                  <ColorPicker
                    value={fillColor.startsWith('#') ? fillColor as `#${string}` : '#000000'}
                    side="left"
                    align="start"
                    onValueChange={({ hex }) => applyStyle({ fillColor: hex })}
                  />
                )}
              </section>
            )}

            <section>
              <SectionLabel>Stroke Width</SectionLabel>
              <div className="flex gap-1">
                {STROKE_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => applyStyle({ strokeWidth: w })}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: strokeWidth === w ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: strokeWidth === w ? '#fff' : 'var(--text-secondary)',
                      boxShadow: strokeWidth === w ? '0 0 8px var(--accent-glow)' : 'none',
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>Stroke Style</SectionLabel>
              <div className="flex gap-1">
                {STROKE_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applyStyle({ strokeStyle: s.id })}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: strokeStyle === s.id ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: strokeStyle === s.id ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-2">
                <SectionLabel>Opacity</SectionLabel>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[opacity]}
                onValueChange={([val]) => applyStyle({ opacity: val })}
                className="w-full"
              />
            </section>

            {/* ── Arrow-specific controls ──────────────────────────────── */}
            {(activeTool === ToolName.ARROW || (selectedIds.size > 0 && elements.some(el => selectedIds.has(el.id) && el.type === 'arrow'))) && (
              <>
                <section>
                  <SectionLabel>Routing</SectionLabel>
                  <div className="flex gap-1">
                    {(['straight', 'elbow'] as const).map(style => {
                      const isActive = (() => {
                        if (selectedIds.size > 0) {
                          const sel = elements.find(el => selectedIds.has(el.id) && el.type === 'arrow');
                          return sel ? (sel as any).lineStyle === style : style === arrowLineStyle;
                        }
                        return style === arrowLineStyle;
                      })();
                      return (
                        <button key={style}
                          onClick={() => {
                            setArrowLineStyle(style);
                            const sg = SceneGraphService.get();
                            if (sg && selectedIds.size > 0) {
                              useHistoryStore.getState().recordState(sg.getElements());
                              selectedIds.forEach(id => sg.update(id, { lineStyle: style } as any));
                            }
                          }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: isActive ? 'var(--accent)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-secondary)' }}
                        >
                          {style === 'straight' ? '╱ Straight' : '⌐ Elbow'}
                        </button>
                      );
                    })}
                  </div>
                </section>
 
                <section>
                  <SectionLabel>Arrow Head</SectionLabel>
                  <div className="flex gap-1">
                    {([
                      { label: '→', startArrowHead: 'none',  endArrowHead: 'arrow', title: 'End only' },
                      { label: '←', startArrowHead: 'arrow', endArrowHead: 'none',  title: 'Start only' },
                      { label: '↔', startArrowHead: 'arrow', endArrowHead: 'arrow', title: 'Both ends' },
                      { label: '—', startArrowHead: 'none',  endArrowHead: 'none',  title: 'None' },
                    ] as const).map(opt => {
                      const isActive = (() => {
                        if (selectedIds.size > 0) {
                          const sel = elements.find(el => selectedIds.has(el.id) && el.type === 'arrow') as any;
                          if (sel) return (sel.startArrowHead ?? 'none') === opt.startArrowHead && (sel.endArrowHead ?? 'arrow') === opt.endArrowHead;
                        }
                        return arrowStartHead === opt.startArrowHead && arrowEndHead === opt.endArrowHead;
                      })();
                      return (
                        <button key={opt.label}
                          title={opt.title}
                          onClick={() => {
                            setArrowStartHead(opt.startArrowHead);
                            setArrowEndHead(opt.endArrowHead);
                            const sg = SceneGraphService.get();
                            if (sg && selectedIds.size > 0) {
                              useHistoryStore.getState().recordState(sg.getElements());
                              selectedIds.forEach(id => sg.update(id, { startArrowHead: opt.startArrowHead, endArrowHead: opt.endArrowHead } as any));
                            }
                          }}
                          className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                          style={{ background: isActive ? 'var(--accent)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-secondary)' }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {selectedIds.size > 0 && sceneGraph && (
          <>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <section>
              <SectionLabel>Layer</SectionLabel>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { icon: ArrowUpToLine, label: 'Front', action: () => {
                    const sg = SceneGraphService.get();
                    if (sg) {
                      useHistoryStore.getState().recordState(sg.getElements());
                      sceneGraph.bringToFront(selectedId);
                    }
                  }},
                  { icon: ArrowUp, label: 'Forward', action: () => {
                    const sg = SceneGraphService.get();
                    if (sg) {
                      useHistoryStore.getState().recordState(sg.getElements());
                      sceneGraph.bringForward(selectedId);
                    }
                  }},
                  { icon: ArrowDown, label: 'Backward', action: () => {
                    const sg = SceneGraphService.get();
                    if (sg) {
                      useHistoryStore.getState().recordState(sg.getElements());
                      sceneGraph.sendBackward(selectedId);
                    }
                  }},
                  { icon: ArrowDownToLine, label: 'Back', action: () => {
                    const sg = SceneGraphService.get();
                    if (sg) {
                      useHistoryStore.getState().recordState(sg.getElements());
                      sceneGraph.sendToBack(selectedId);
                    }
                  }},
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    title={label}
                    className="flex items-center justify-center p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </section>

            <div style={{ height: '1px', background: 'var(--border)' }} />
            <button
              onClick={deleteSelected}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};
