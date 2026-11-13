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

export interface DeleteTarget {
  kind: 'card' | 'badge';
  index: number;
}

interface DeleteItemDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
}

/** Confirms deleting a card or badge, whether it was requested from the inspector or canvas. */
export function DeleteItemDialog({ target, onClose }: DeleteItemDialogProps) {
  const { dispatch } = useDraft();
  const noun = target?.kind === 'badge' ? 'badge' : 'card';

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {noun}?</AlertDialogTitle>
          <AlertDialogDescription>
            The {noun} is removed from the dashboard draft. Discard restores it until you save.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={() => {
              if (!target) {
                return;
              }

              dispatch(
                target.kind === 'card'
                  ? { type: 'delete-card', index: target.index }
                  : { type: 'delete-badge', index: target.index },
              );
            }}
          >
            Delete {noun}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
