import { useEffect, useReducer } from 'react';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import { draftReducer, initialDraft, isDirty } from './draftReducer';
import type { DraftAction, DraftState } from './draftReducer';

const emptyDocument: DashboardDocument = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
};

export function useDashboardDraft(): [DraftState, (action: DraftAction) => void] {
  const [state, dispatch] = useReducer(draftReducer, emptyDocument, initialDraft);
  const dirty = isDirty(state);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return [state, dispatch];
}
