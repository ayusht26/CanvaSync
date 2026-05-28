import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore.js';

export const useTheme = () => {
  const theme = useCanvasStore((state) => state.theme);
  const setTheme = useCanvasStore((state) => state.setTheme);

  // Sync store from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');
  }, [setTheme]);

  // When store changes (from AnimatedThemeToggler via localStorage), update CSS vars
  useEffect(() => {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.style.setProperty('--bg-primary', '#111113');
      document.documentElement.style.setProperty('--bg-secondary', '#18181b');
      document.documentElement.style.setProperty('--bg-surface', '#1f1f23');
      document.documentElement.style.setProperty('--bg-elevated', '#27272a');
      document.documentElement.style.setProperty('--border', '#2e2e33');
      document.documentElement.style.setProperty('--text-primary', '#fafafa');
      document.documentElement.style.setProperty('--text-secondary', '#a1a1aa');
      document.documentElement.style.setProperty('--text-muted', '#52525b');
      document.documentElement.style.setProperty('--toolbar-bg', 'rgba(27, 27, 31, 0.90)');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#f4f4f5');
      document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
      document.documentElement.style.setProperty('--bg-surface', '#e4e4e7');
      document.documentElement.style.setProperty('--bg-elevated', '#d4d4d8');
      document.documentElement.style.setProperty('--border', '#d1d5db');
      document.documentElement.style.setProperty('--text-primary', '#09090b');
      document.documentElement.style.setProperty('--text-secondary', '#71717a');
      document.documentElement.style.setProperty('--text-muted', '#a1a1aa');
      document.documentElement.style.setProperty('--toolbar-bg', 'rgba(255, 255, 255, 0.88)');
    }
  }, [theme]);

  // Listen for class changes from AnimatedThemeToggler and sync store
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
