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

const darkTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'var(--bg-primary)' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { color: 'var(--text-primary)' },
  '.cm-cursor': { borderLeftColor: 'var(--text-primary)' },
  '.cm-gutters': { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)', borderRight: '1px solid var(--border)' },
  '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-hover)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'var(--bg-hover)' },
});

export function QueryEditor({ onExecute }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { queryText, setQueryText, activeConnection } = useAppStore();

  const isMongo = activeConnection?.db_type === 'mongodb';

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
        darkTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setQueryText(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => { view.destroy(); };
  }, [activeConnection?.id]);

  return (
    <div ref={containerRef} className="h-full" />
  );
}
