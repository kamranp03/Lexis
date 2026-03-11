import { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { useAppStore } from '../../stores/appStore';

interface Props {
  onExecute: () => void;
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', background: 'var(--bg-primary)' },
  '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  '.cm-content': { color: 'var(--text-primary)', caretColor: 'var(--accent)', padding: '8px 0' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-gutters': {
    background: 'var(--bg-secondary)', color: 'var(--text-tertiary)',
    borderRight: '1px solid var(--border)', paddingRight: '8px', minWidth: '40px',
  },
  '.cm-lineNumbers .cm-gutterElement': { color: 'var(--text-tertiary)' },
  '.cm-activeLine': { background: 'var(--bg-hover)' },
  '.cm-activeLineGutter': { background: 'var(--bg-hover)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'rgba(59,130,246,0.15)' },
  '.cm-line': { paddingLeft: '12px' },
  '.cm-placeholder': { color: 'var(--text-tertiary)' },
});

export function QueryEditor({ onExecute }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { queryText, setQueryText, activeConnection } = useAppStore();

  const isMongo = activeConnection?.db_type === 'mongodb';

  // Track whether the last change came from within the editor (to avoid feedback loop)
  const internalChangeRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const runKeymap = keymap.of([
      { key: 'Mod-Enter', run: () => { onExecute(); return true; } },
    ]);

    const state = EditorState.create({
      doc: queryText,
      extensions: [
        basicSetup,
        isMongo ? json() : sql(),
        runKeymap,
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            internalChangeRef.current = true;
            setQueryText(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => { view.destroy(); };
  }, [activeConnection?.id]);

  // Sync external queryText changes (e.g. from NLP) into the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    const current = view.state.doc.toString();
    if (current !== queryText) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: queryText },
      });
    }
  }, [queryText]);

  return (
    <div ref={containerRef} className="h-full" />
  );
}
