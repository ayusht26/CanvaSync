import React from 'react';
import {
  MousePointer2, Hand, Pencil, Square, Circle,
  Minus, ArrowRight, Type, Eraser, Triangle, Diamond
} from 'lucide-react';
import { ToolName } from '@canvasync/shared';
import { useCanvasStore } from '../../store/useCanvasStore.js';
import { ToolButton } from './ToolButton.js';

const TOOL_GROUPS = [
  {
    tools: [
      { id: ToolName.SELECTION, icon: MousePointer2, label: 'Select', shortcut: 'V' },
      { id: ToolName.PAN, icon: Hand, label: 'Pan', shortcut: 'H' },
    ]
  },
  {
    tools: [
      { id: ToolName.PEN, icon: Pencil, label: 'Pen', shortcut: 'P' },
      { id: ToolName.ERASER, icon: Eraser, label: 'Eraser', shortcut: 'X' },
    ]
  },
  {
    tools: [
      { id: ToolName.RECTANGLE, icon: Square, label: 'Rectangle', shortcut: 'R' },
      { id: ToolName.ELLIPSE, icon: Circle, label: 'Ellipse', shortcut: 'E' },
      { id: ToolName.TRIANGLE, icon: Triangle, label: 'Triangle', shortcut: 'G' },
      { id: ToolName.RHOMBUS, icon: Diamond, label: 'Diamond', shortcut: 'D' },
    ]
  },
  {
    tools: [
      { id: ToolName.LINE, icon: Minus, label: 'Line', shortcut: 'L' },
      { id: ToolName.ARROW, icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
    ]
  },
  {
    tools: [
      { id: ToolName.TEXT, icon: Type, label: 'Text', shortcut: 'T' },
    ]
  },
];

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div
      className="fixed left-0 right-0 z-40 flex flex-row items-center gap-0.5 px-2 py-1 no-scrollbar"
      style={{
        top: '44px',  // directly below TopBar (44px tall)
        background: 'var(--toolbar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        height: '46px',
        overflowX: 'auto',
        cursor: 'default',
        pointerEvents: 'all',
      }}
      onPointerDown={e => e.stopPropagation()}
      onPointerMove={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
    >
      {TOOL_GROUPS.map((group, groupIdx) => (
        <React.Fragment key={groupIdx}>
          {groupIdx > 0 && (
            <div className="my-1 mx-1" style={{ width: '1px', height: '28px', background: 'var(--border)', flexShrink: 0 }} />
          )}
          {group.tools.map((tool) => (
            <ToolButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              shortcut={tool.shortcut}
              isActive={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id as ToolName)}
              horizontal
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
