import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (options: { name?: string; includeElements: boolean }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [includeElements, setIncludeElements] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name: name.trim() || undefined, includeElements });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-scale-in">
        <div className="px-8 pt-8 pb-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Room</h2>
            <p className="text-sm text-[var(--text-secondary)]">Invite others to collaborate in real-time.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Board"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Starting State
              </label>
              <div 
                className={`p-4 border rounded-xl cursor-pointer transition-all ${includeElements ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'}`}
                onClick={() => setIncludeElements(true)}
              >
                <div className="font-semibold text-[var(--text-primary)] text-sm mb-1">Take current board with me</div>
                <div className="text-xs text-[var(--text-muted)]">Keep all shapes currently drawn on your local canvas.</div>
              </div>
              <div 
                className={`p-4 border rounded-xl cursor-pointer transition-all ${!includeElements ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'}`}
                onClick={() => setIncludeElements(false)}
              >
                <div className="font-semibold text-[var(--text-primary)] text-sm mb-1">Start Fresh</div>
                <div className="text-xs text-[var(--text-muted)]">Create a completely blank new board.</div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-4 rounded-xl shadow-[var(--shadow-md)] transition-all active:scale-[0.98]"
            >
              Create & Share
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
