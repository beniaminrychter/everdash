import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { DraftAlerts } from '@/app/DraftAlerts';
import { useDraft } from '@/app/DraftContext';
import { PageHeader } from '@/app/PageHeader';
import type { DraftState } from '@/app/draft/draftReducer';
import { CanvasIsland } from './CanvasIsland';
import { CanvasToolbar } from './CanvasToolbar';
import { DeleteItemDialog } from './DeleteItemDialog';
import type { DeleteTarget } from './DeleteItemDialog';
import { Inspector } from './Inspector';
import { ViewTabs } from './ViewTabs';

/** Reads a current canvas delete request. Stale or out-of-range messages are ignored. */
function deleteRequest(message: unknown, state: DraftState): DeleteTarget | null {
  if (typeof message !== 'object' || message === null) {
    return null;
  }

  const { type, index, generation, viewId } = message as Record<string, unknown>;
  const kind =
    type === 'everdash.editor.card.delete'
      ? 'card'
      : type === 'everdash.editor.badge.delete'
        ? 'badge'
        : null;
  const view = state.document.views.find((item) => item.id === state.viewId);
  const count = (kind === 'card' ? view?.cards : view?.badges)?.length ?? 0;

  if (
    !kind ||
    generation !== state.generation ||
    viewId !== state.viewId ||
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= count
  ) {
    return null;
  }

  return { kind, index };
}

export function EditorPage() {
  const { state, dispatch } = useDraft();
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const latest = useRef(state);

  useLayoutEffect(() => {
    latest.current = state;
  });

  const handleMessage = useCallback(
    (message: unknown) => {
      // The reducer only selects on a canvas delete; the confirmation belongs to this page.
      const request = deleteRequest(message, latest.current);

      dispatch({ type: 'canvas-message', message });

      if (request) {
        setDeleting(request);
      }
    },
    [dispatch],
  );

  const renameView = useCallback(() => {
    dispatch({ type: 'select', selection: { kind: 'view' } });
    setViewSheetOpen(true);
    // Waits for the menu to close and the sheet (below lg) to mount before focusing.
    window.setTimeout(() => {
      const input = document.querySelector('#view-name') as HTMLInputElement | null;

      input?.focus();
      input?.select();
    }, 150);
  }, [dispatch]);

  return (
    <div className="flex h-svh min-h-0 flex-col">
      <PageHeader>
        <ViewTabs onRename={renameView} />
      </PageHeader>
      <div className="flex min-h-0 flex-1">
        <div className="bg-muted min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <DraftAlerts />
            <div>
              <CanvasToolbar />
              <CanvasIsland
                document={state.document}
                viewId={state.viewId}
                generation={state.generation}
                onMessage={handleMessage}
              />
            </div>
          </div>
        </div>
        <Inspector
          viewSheetOpen={viewSheetOpen}
          onViewSheetOpenChange={setViewSheetOpen}
          onRequestDelete={setDeleting}
        />
      </div>
      <DeleteItemDialog target={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
