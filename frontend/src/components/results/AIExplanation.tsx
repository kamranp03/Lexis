import { Sparkles, X } from 'lucide-react';

interface Props {
  text: string;
  onClose: () => void;
}

export function AIExplanation({ text, onClose }: Props) {
  return (
    <div className="border-b border-[var(--border)] bg-blue-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <Sparkles size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-blue-100 shrink-0">
          <X size={14} className="text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
