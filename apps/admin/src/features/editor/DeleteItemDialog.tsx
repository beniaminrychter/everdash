import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useDraft } from '@/app/DraftContext';

export type DeleteTarget =
  | { kind: 'card'; section?: string | null; index: number }
  | { kind: 'badge'; index: number }
  | { kind: 'section'; id: string };

interface DeleteItemDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
}

/** Confirms deleting a card, badge or section, whether it was requested from the inspector or canvas. */
export function DeleteItemDialog({ target, onClose }: DeleteItemDialogProps) {
  const { state, dispatch } = useDraft();
  const section =
    target?.kind === 'section'
      ? state.document.views
          .find((view) => view.id === state.viewId)
          ?.sections?.find((item) => item.id === target.id)
      : undefined;
  const cardCount = section?.cards?.length ?? 0;
  const noun = target?.kind === 'badge' ? 'badge' : target?.kind === 'section' ? 'section' : 'card';
  const destructive = buttonVariants({ variant: 'destructive' });

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {noun}?</AlertDialogTitle>
          <AlertDialogDescription>
            {target?.kind === 'section' && cardCount > 0
              ? `“${section?.title}” has ${cardCount} ${cardCount === 1 ? 'card' : 'cards'}. Delete them with the section, or keep them in the view outside any section. Discard restores everything until you save.`
              : `The ${noun} is removed from the dashboard draft. Discard restores it until you save.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {target?.kind === 'section' && cardCount > 0 && (
            <AlertDialogAction
              className={buttonVariants({ variant: 'outline' })}
              onClick={() => dispatch({ type: 'delete-section', id: target.id, cards: 'keep' })}
            >
              Keep cards
            </AlertDialogAction>
          )}
          <AlertDialogAction
            className={destructive}
            onClick={() => {
              if (!target) {
                return;
              }

              if (target.kind === 'section') {
                dispatch({ type: 'delete-section', id: target.id, cards: 'delete' });

                return;
              }

              dispatch(
                target.kind === 'card'
                  ? { type: 'delete-card', section: target.section, index: target.index }
                  : { type: 'delete-badge', index: target.index },
              );
            }}
          >
            {target?.kind === 'section' && cardCount > 0
              ? 'Delete section and cards'
              : `Delete ${noun}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
