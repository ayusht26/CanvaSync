import React from 'react';
import { 
  ArrowUpToLine, 
  ArrowDownToLine, 
  ArrowUp, 
  ArrowDown,
} from 'lucide-react';
import { useSelectionStore } from '../../store/useSelectionStore';
import { SceneGraph } from '../../canvas/SceneGraph';

interface LayerControlsProps {
  sceneGraph: SceneGraph;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ sceneGraph }) => {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  
  if (selectedIds.size === 0) return null;

  // We only apply layer operations to the first selected item for simplicity, 
  // or we could loop through them. SceneGraph methods currently take a single ID.
  const selectedId = Array.from(selectedIds)[0];

  const handleAction = (action: (id: string) => void) => {
    if (selectedId) {
      action.call(sceneGraph, selectedId);
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="px-3 py-1 border-r border-slate-800 flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layer</span>
      </div>
      
      <div className="flex items-center gap-1 px-1">
        <button
          onClick={() => handleAction(sceneGraph.bringToFront)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Bring to Front"
        >
          <ArrowUpToLine size={18} />
        </button>
        
        <button
          onClick={() => handleAction(sceneGraph.bringForward)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Bring Forward"
        >
          <ArrowUp size={18} />
        </button>
        
        <button
          onClick={() => handleAction(sceneGraph.sendBackward)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Send Backward"
        >
          <ArrowDown size={18} />
        </button>
        
        <button
          onClick={() => handleAction(sceneGraph.sendToBack)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Send to Back"
        >
          <ArrowDownToLine size={18} />
        </button>
      </div>
    </div>
  );
};
