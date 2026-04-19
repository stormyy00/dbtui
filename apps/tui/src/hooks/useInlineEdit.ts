import { useState, useCallback } from 'react';
import type { Key } from 'ink';

export interface UseInlineEditReturn {
  editing: boolean;
  draft: string;
  startEdit: (initialValue: string) => void;
  cancelEdit: () => void;
  /** Process a keystroke while editing. Returns the committed string on Enter, null otherwise. */
  handleInput: (input: string, key: Key) => string | null;
}

export function useInlineEdit(): UseInlineEditReturn {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = useCallback((initialValue: string) => {
    setDraft(initialValue);
    setEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft('');
  }, []);

  const handleInput = useCallback(
    (input: string, key: Key): string | null => {
      if (key.return) {
        const value = draft.trim();
        setEditing(false);
        setDraft('');
        return value;
      }
      if (key.escape) {
        setEditing(false);
        setDraft('');
        return null;
      }
      if (key.backspace || key.delete) {
        setDraft((v) => v.slice(0, -1));
        return null;
      }
      if (input && !key.ctrl && !key.meta && !key.tab && !key.upArrow && !key.downArrow) {
        setDraft((v) => v + input);
      }
      return null;
    },
    [draft],
  );

  return { editing, draft, startEdit, cancelEdit, handleInput };
}
