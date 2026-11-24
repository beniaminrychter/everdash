import { createContext, useContext } from 'react';

export interface EditorDialogActions {
  /** Keeps what was changed and closes. */
  done: () => void;
  /** Puts everything changed since the dialog opened back and closes. */
  cancel: () => void;
}

export const EditorDialogContext = createContext<EditorDialogActions | null>(null);

export function useEditorDialog(): EditorDialogActions {
  const actions = useContext(EditorDialogContext);

  if (!actions) {
    throw new Error('useEditorDialog must be used within the EditorDialog.');
  }

  return actions;
}
