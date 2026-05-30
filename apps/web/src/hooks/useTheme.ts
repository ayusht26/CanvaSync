import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useStyleStore } from '../store/useStyleStore.js';
import { SceneGraphService } from '../canvas/SceneGraphService.js';

const DARK_STROKE  = '#ffffff';
const LIGHT_STROKE = '#09090b';

/** Swap the canonical black↔white on all existing shapes so content stays visible. */
function swapShapeColors(toDark: boolean) {
  const sceneGraph = SceneGraphService.get();
  if (!sceneGraph) return;

  const from = toDark ? LIGHT_STROKE : DARK_STROKE;
  const to   = toDark ? DARK_STROKE  : LIGHT_STROKE;

  sceneGraph.getElements().forEach((shape) => {
    const updates: Record<string, string> = {};

    // Stroke color
    if (shape.strokeColor === from) updates.strokeColor = to;

    // Text color (TextShape carries its own textColor)
    if ((shape as any).textColor === from) updates.textColor = to;

    if (Object.keys(updates).length > 0) {
      sceneGraph.update(shape.id, updates as any);
    }
  });
}

export const useTheme = () => {
  const theme   = useCanvasStore((state) => state.theme);
  const setTheme = useCanvasStore((state) => state.setTheme);
  const setStrokeColor = useStyleStore((state) => state.setStrokeColor);

  // Track whether this is the very first time the theme mounts
  const isFirstMount = useRef(true);

  // ── Sync store from localStorage on first mount ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const preferred =
      saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');
  }, [setTheme]);

  // ── When theme changes: update CSS vars + default stroke color ──────────
  useEffect(() => {
    const isDark = theme === 'dark';

    // Update CSS custom properties
    if (isDark) {
      document.documentElement.style.setProperty('--bg-primary',    '#111113');
      document.documentElement.style.setProperty('--bg-secondary',  '#18181b');
      document.documentElement.style.setProperty('--bg-surface',    '#1f1f23');
      document.documentElement.style.setProperty('--bg-elevated',   '#27272a');
      document.documentElement.style.setProperty('--border',        '#2e2e33');
      document.documentElement.style.setProperty('--text-primary',  '#fafafa');
      document.documentElement.style.setProperty('--text-secondary','#a1a1aa');
      document.documentElement.style.setProperty('--text-muted',    '#52525b');
      document.documentElement.style.setProperty('--toolbar-bg',    'rgba(27, 27, 31, 0.90)');
    } else {
      document.documentElement.style.setProperty('--bg-primary',    '#f4f4f5');
      document.documentElement.style.setProperty('--bg-secondary',  '#ffffff');
      document.documentElement.style.setProperty('--bg-surface',    '#e4e4e7');
      document.documentElement.style.setProperty('--bg-elevated',   '#d4d4d8');
      document.documentElement.style.setProperty('--border',        '#d1d5db');
      document.documentElement.style.setProperty('--text-primary',  '#09090b');
      document.documentElement.style.setProperty('--text-secondary','#71717a');
      document.documentElement.style.setProperty('--text-muted',    '#a1a1aa');
      document.documentElement.style.setProperty('--toolbar-bg',    'rgba(255, 255, 255, 0.88)');
    }

    // Update the stroke color in the style store only if it is white/black
    // (Irrespective of whether specifically chosen or not: White -> Black on light; Black -> White on dark)
    const currentStroke = useStyleStore.getState().strokeColor;
    if (isDark) {
      if (currentStroke === LIGHT_STROKE || currentStroke === '#000000') {
        setStrokeColor(DARK_STROKE);
      }
    } else {
      if (currentStroke === DARK_STROKE || currentStroke === '#ffffff') {
        setStrokeColor(LIGHT_STROKE);
      }
    }

    // On theme *changes* (not the initial mount), swap existing shape colors
    if (!isFirstMount.current) {
      swapShapeColors(isDark);
    }
    isFirstMount.current = false;
  }, [theme, setStrokeColor]);


  // ── Listen for class changes from AnimatedThemeToggler and sync store ────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [setTheme]);

  return { theme };
};
