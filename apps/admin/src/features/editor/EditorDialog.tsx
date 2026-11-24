import { useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDraft } from '@/app/DraftContext';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import type { DraftState } from '@/app/draft/draftReducer';
import { isIncomplete } from '@/app/draft/incomplete';
import { BadgeInspector } from './BadgeInspector';
import { CardInspector } from './CardInspector';
import type { DeleteTarget } from './DeleteItemDialog';
import { EditorDialogContext } from './editorDialogContext';
import { SectionInspector } from './SectionInspector';
import { findOpener, rememberOpener } from './sheetOpener';
import type { OpenerMemory } from './sheetOpener';
import { ViewInspector } from './ViewInspector';

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The dashboard as it was when the dialog opened, which Cancel puts back. */
  baseline: DashboardDocument | null;
  onRequestDelete: (target: DeleteTarget) => void;
}

/** Whether the selection is a card or badge that is still being added, and which one. */
function pendingKey(state: DraftState): string | null {
  const { selection } = state;

  if (selection.kind === 'pending-badge') {
    return 'badge';
  }

  if (selection.kind !== 'card') {
    return null;
  }

  const view = state.document.views.find((item) => item.id === state.viewId);
  const section = selection.section ?? null;
  const list =
    section === null ? view?.cards : view?.sections?.find((item) => item.id === section)?.cards;
  const card = list?.[selection.index];

  return card && isIncomplete(card) ? `card:${section ?? ''}:${selection.index}` : null;
}

function EditorContent({ onRequestDelete }: Pick<EditorDialogProps, 'onRequestDelete'>) {
  const { state } = useDraft();
  const { selection } = state;

  switch (selection.kind) {
    case 'card': {
      return (
        <CardInspector
          key={`${state.viewId}-card-${selection.section ?? ''}-${selection.index}`}
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'section': {
      return (
        <SectionInspector
          key={`${state.viewId}-section-${selection.id}`}
          id={selection.id}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'badge': {
      return (
        <BadgeInspector
          key={`${state.viewId}-badge-${selection.index}`}
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'pending-badge': {
      return (
        <BadgeInspector
          key="pending-badge"
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    default: {
      return <ViewInspector />;
    }
  }
}

/**
 * The one place a card, badge, section or view is edited: a centered dialog with the form and a
 * live preview of the item, full screen on narrow windows. Edits go to the draft as they are typed.
 */
export function EditorDialog({ open, onOpenChange, baseline, onRequestDelete }: EditorDialogProps) {
  const { state, dispatch } = useDraft();
  // The dialog has no trigger, so it hands focus back to whatever opened it, such as a canvas button.
  const opener = useRef<OpenerMemory | null>(null);
  const { selection } = state;

  const pending = pendingKey(state);
  const previous = useRef({ pending, kind: selection.kind });

  useEffect(() => {
    const before = previous.current;

    previous.current = { pending, kind: selection.kind };

    if (!open) {
      return;
    }

    // Adding the card or badge finishes the job, so the dialog closes behind it.
    if (before.pending !== null && pending === null && selection.kind !== 'view') {
      dispatch({ type: 'select', selection: { kind: 'view' } });
    }

    // So does deleting or cancelling the item being edited, which leaves nothing selected.
    if (before.kind !== 'view' && selection.kind === 'view') {
      onOpenChange(false);
    }
  }, [open, pending, selection.kind, dispatch, onOpenChange]);

  const actions = useMemo(
    () => ({
      done() {
        onOpenChange(false);
        dispatch({ type: 'select', selection: { kind: 'view' } });
      },
      // Escape, the close button and a click outside all cancel too. A card that is still being
      // added stays in the draft, as selecting away always left it (saving is blocked until it is
      // finished; its own Cancel removes it), and a badge that is still being added is dropped.
      cancel() {
        onOpenChange(false);

        if (baseline && pending === null) {
          dispatch({ type: 'replace', document: baseline });

          return;
        }

        dispatch({ type: 'select', selection: { kind: 'view' } });
      },
    }),
    [baseline, dispatch, onOpenChange, pending],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          actions.cancel();
        }
      }}
    >
      <DialogContent
        showCloseButton
        className={`flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 sm:max-w-full md:h-[min(40rem,calc(100dvh-4rem))] md:rounded-xl md:border ${
          selection.kind === 'view' ? 'md:max-w-md' : 'md:max-w-4xl'
        }`}
        onOpenAutoFocus={() => {
          opener.current = rememberOpener(document.activeElement);
        }}
        onCloseAutoFocus={(event) => {
          const target = findOpener(opener.current);

          opener.current = null;

          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <EditorDialogContext.Provider value={actions}>
          <EditorContent onRequestDelete={onRequestDelete} />
        </EditorDialogContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
