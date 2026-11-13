import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { UnauthorizedError, api } from '@/lib/api';
import { draftIssues } from './draft/draftReducer';
import type { DraftAction, DraftState } from './draft/draftReducer';
import { useDashboardDraft } from './draft/useDashboardDraft';

interface DraftContextValue {
  state: DraftState;
  dispatch: (action: DraftAction) => void;
  save: () => Promise<void>;
  restorePrevious: () => Promise<void>;
  loadError: string;
  recovery: string | null;
  previousAvailable: boolean;
  saving: boolean;
  saveError: string;
}

const DraftContext = createContext<DraftContextValue | null>(null);

const recoveryFallback =
  'Saved settings need recovery. Import a valid document or build a replacement, then save it.';

function describeSaveError(error: unknown): string {
  const issue = error as Error & {
    code?: string;
    issues?: { path?: string; message?: string }[];
  };

  if (issue.code === 'CONFIG_CONFLICT') {
    return 'Another Home Assistant editor saved a newer dashboard. Your draft is unchanged; reload before saving again.';
  }

  const details = issue.issues?.map((item) => `${item.path || 'Dashboard'}: ${item.message}`) ?? [];

  return [issue.message, ...details].filter(Boolean).join(' ');
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useDashboardDraft();
  const [loadError, setLoadError] = useState('');
  const [recovery, setRecovery] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [previousAvailable, setPreviousAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await api.getConfig();

        if (!active) {
          return;
        }

        dispatch({ type: 'loaded', document: result.config, revision: result.revision });
        setConfigured(result.configured);
        setPreviousAvailable(result.previousAvailable);
        setRecovery(result.recovery ? result.diagnostic || recoveryFallback : null);
        setLoadError('');
      } catch (error) {
        // A 401 is handled once in AdminRoot, which swaps this whole tree for SignIn.
        if (!active || error instanceof UnauthorizedError) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : 'Dashboard settings could not be loaded.',
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const save = useCallback(async () => {
    if (draftIssues(state).length > 0) {
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const result = await api.saveConfig(state.revision, state.document);

      dispatch({ type: 'saved', document: result.config, revision: result.revision });
      // A save moves the old saved dashboard to "previous", but only if one existed.
      setPreviousAvailable(configured || previousAvailable);
      setConfigured(true);
      setRecovery(null);
      setSaving(false);
      toast.success('Dashboard saved');
    } catch (error) {
      setSaving(false);

      if (!(error instanceof UnauthorizedError)) {
        setSaveError(describeSaveError(error));
      }
    }
  }, [configured, dispatch, previousAvailable, state]);

  const restorePrevious = useCallback(async () => {
    try {
      const result = await api.getPreviousConfig();

      dispatch({ type: 'replace', document: result.config });
      setSaveError('');
      toast.info('Previous dashboard loaded', { description: 'Save to restore it.' });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return;
      }

      setSaveError(
        error instanceof Error ? error.message : 'Previous dashboard could not be loaded.',
      );
    }
  }, [dispatch]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      save,
      restorePrevious,
      loadError,
      recovery,
      previousAvailable,
      saving,
      saveError,
    }),
    [
      state,
      dispatch,
      save,
      restorePrevious,
      loadError,
      recovery,
      previousAvailable,
      saving,
      saveError,
    ],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const value = useContext(DraftContext);

  if (!value) {
    throw new Error('useDraft must be used inside DraftProvider.');
  }

  return value;
}
