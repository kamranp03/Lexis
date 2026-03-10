import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { QueryResult } from '../../api/client';

interface Props {
  result: QueryResult;
}

export function DocumentView({ result }: Props) {
  const documents = result.documents || [];

  if (documents.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--text-secondary)]">
        No documents returned.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1 overflow-auto h-full">
      <div className="text-xs text-[var(--text-tertiary)] mb-2">
        {documents.length} document{documents.length !== 1 ? 's' : ''}
      </div>
      {documents.map((doc, i) => (
        <DocumentItem key={i} index={i} data={doc} />
      ))}
    </div>
  );
}

function DocumentItem({ index, data }: { index: number; data: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(index < 5);

  return (
    <div className="border border-[var(--border)] rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Document {index + 1}
        {data._id && <span className="text-[var(--text-tertiary)] ml-1">({String(data._id)})</span>}
      </button>
      {expanded && (
        <div className="px-3 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
          <JsonTree data={data} depth={0} />
        </div>
      )}
    </div>
  );
}

function JsonTree({ data, depth }: { data: unknown; depth: number }) {
  if (data === null) return <span className="text-[var(--text-tertiary)] italic text-xs">null</span>;
  if (typeof data === 'boolean') return <span className="text-orange-600 text-xs">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-blue-600 text-xs">{data}</span>;
  if (typeof data === 'string') return <span className="text-green-700 text-xs">"{data}"</span>;

  if (Array.isArray(data)) {
    return <CollapsibleNode label={`Array(${data.length})`} depth={depth}>
      {data.map((item, i) => (
        <div key={i} className="flex gap-1" style={{ paddingLeft: 12 }}>
          <span className="text-[var(--text-tertiary)] text-xs shrink-0">{i}:</span>
          <JsonTree data={item} depth={depth + 1} />
        </div>
      ))}
    </CollapsibleNode>;
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    return <CollapsibleNode label={`{${entries.length}}`} depth={depth}>
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-1" style={{ paddingLeft: 12 }}>
          <span className="text-purple-600 text-xs shrink-0">{key}:</span>
          <JsonTree data={val} depth={depth + 1} />
        </div>
      ))}
    </CollapsibleNode>;
  }

  return <span className="text-xs">{String(data)}</span>;
}

function CollapsibleNode({ label, depth, children }: { label: string; depth: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(depth < 2);

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-0.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span className="text-[var(--text-tertiary)]">{label}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
