import { useRef, useState } from 'react';
import { EllipsisIcon } from 'lucide-react';
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDraft } from '@/app/DraftContext';

interface ViewMenuProps {
  onRename: () => void;
}

export function ViewMenu({ onRename }: ViewMenuProps) {
  const { state, dispatch } = useDraft();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const renaming = useRef(false);
  const { views } = state.document;
  const index = views.findIndex((view) => view.id === state.viewId);
  const view = views[index];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="View options">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={(event) => {
            // Renaming moves focus to the name field, so the menu must not take it back.
            if (renaming.current) {
              event.preventDefault();
              renaming.current = false;
            }
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              renaming.current = true;
              onRename();
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index <= 0}
            onSelect={() => dispatch({ type: 'move-view', offset: -1 })}
          >
            Move earlier
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === -1 || index >= views.length - 1}
            onSelect={() => dispatch({ type: 'move-view', offset: 1 })}
          >
            Move later
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={views.length <= 1}
            onSelect={() => setConfirmingDelete(true)}
          >
            Delete view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{view?.title || 'this view'}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The view and its cards and badges are removed from the dashboard draft. Discard
              restores them until you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => dispatch({ type: 'delete-view' })}
            >
              Delete view
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
