import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DraftAlerts } from '@/app/DraftAlerts';
import { useDraft } from '@/app/DraftContext';
import { PageHeader } from '@/app/PageHeader';
import type { CardConfig } from '@everdash/contracts/config/types';
import type { DraftState } from '@/app/draft/draftReducer';
import { isIncomplete } from '@/app/draft/incomplete';
import { CanvasIsland } from './CanvasIsland';
import { CanvasToolbar } from './CanvasToolbar';
import { DeleteItemDialog } from './DeleteItemDialog';
import type { DeleteTarget } from './DeleteItemDialog';
import { focusInspectorField } from './focusInspectorField';
import { Inspector } from './Inspector';
import { pendingPreview } from './pendingPreview';
import { ViewTabs } from './ViewTabs';

/** Reads a current canvas delete request. Stale or out-of-range messages are ignored. */
function deleteRequest(message: unknown, state: DraftState): DeleteTarget | null {
  if (typeof message !== 'object' || message === null) {
    return null;
  }

  const { type, index, section, generation, viewId } = message as Record<string, unknown>;
  const view = state.document.views.find((item) => item.id === state.viewId);

  if (generation !== state.generation || viewId !== state.viewId) {
    return null;
  }

  if (type === 'everdash.editor.section.delete') {
    const exists = view?.sections?.some((item) => item.id === section);

    return typeof section === 'string' && exists ? { kind: 'section', id: section } : null;
  }

  const kind =
    type === 'everdash.editor.card.delete'
      ? 'card'
      : type === 'everdash.editor.badge.delete'
        ? 'badge'
        : null;
  const sectionId = typeof section === 'string' ? section : null;
  const list =
    kind === 'card'
      ? sectionId === null
        ? view?.cards
        : view?.sections?.find((item) => item.id === sectionId)?.cards
      : view?.badges;

  if (
    !kind ||
    (section !== undefined && section !== null && typeof section !== 'string') ||
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= (list?.length ?? 0)
  ) {
    return null;
  }

  // A card that was only just added is deleted at once by the draft; there is nothing to confirm.
  if (kind === 'card' && isIncomplete((list as readonly CardConfig[])[index]!)) {
    return null;
  }

  return kind === 'card' ? { kind, section: sectionId, index } : { kind, index };
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

      // "Rename" in a section's menu selects the section and puts the cursor in its name.
      if (
        typeof message === 'object' &&
        message !== null &&
        (message as Record<string, unknown>).type === 'everdash.editor.section.rename' &&
        (message as Record<string, unknown>).generation === latest.current.generation
      ) {
        focusInspectorField('section-name');
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

  // Shows a card or badge that is still being added, so its type is visible before it is saved.
  const preview = useMemo(
    () => pendingPreview(state.document, state.viewId, state.selection),
    [state.document, state.viewId, state.selection],
  );

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
                document={preview.document}
                viewId={state.viewId}
                generation={state.generation}
                selection={preview.selection}
                incomplete={preview.incomplete}
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
