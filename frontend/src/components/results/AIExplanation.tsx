import { Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  text: string;
  onClose: () => void;
}

export function AIExplanation({ text, onClose }: Props) {
  return (
    <div
      className="border-b"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-secondary)',
        maxHeight: '55vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 sticky top-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', zIndex: 1 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            AI Analysis
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Markdown content */}
      <div className="px-5 py-4 ai-markdown">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-base font-bold mb-3 mt-1" style={{ color: 'var(--text-primary)' }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold mb-2 mt-4" style={{ color: 'var(--text-primary)' }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-bold mb-1.5 mt-3 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic" style={{ color: 'var(--text-secondary)' }}>{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 space-y-1 pl-4" style={{ listStyleType: 'disc', color: 'var(--text-primary)' }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 space-y-1 pl-4" style={{ listStyleType: 'decimal', color: 'var(--text-primary)' }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{children}</li>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-');
              return isBlock ? (
                <pre
                  className="text-xs rounded-md px-3 py-2.5 my-3 overflow-x-auto font-mono"
                  style={{ background: 'var(--bg-active)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <code>{children}</code>
                </pre>
              ) : (
                <code
                  className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'var(--bg-active)', color: '#f97316', border: '1px solid var(--border)' }}
                >
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="my-3 overflow-x-auto rounded-md" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ background: 'var(--bg-active)' }}>{children}</thead>
            ),
            th: ({ children }) => (
              <th
                className="px-3 py-2 text-left font-semibold"
                style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td
                className="px-3 py-2"
                style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {children}
              </td>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className="pl-3 my-2 text-sm italic"
                style={{ borderLeft: '3px solid var(--accent)', color: 'var(--text-secondary)' }}
              >
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3" style={{ borderColor: 'var(--border)' }} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
