import { useRef, useState } from 'react';
import { EllipsisIcon } from 'lucide-react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
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
          <Button variant="ghost" size="icon-sm" aria-label={m.admin_view_options()}>
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
            {m.editor_rename()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index <= 0}
            onSelect={() => dispatch({ type: 'move-view', offset: -1 })}
          >
            {m.editor_move_earlier()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === -1 || index >= views.length - 1}
            onSelect={() => dispatch({ type: 'move-view', offset: 1 })}
          >
            {m.editor_move_later()}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!view} onSelect={() => dispatch({ type: 'duplicate-view' })}>
            {m.editor_duplicate()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={views.length <= 1}
            onSelect={() => setConfirmingDelete(true)}
          >
            {m.admin_view_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.admin_view_delete_title({ title: view?.title || m.admin_view_this_view() })}
            </AlertDialogTitle>
            <AlertDialogDescription>{m.admin_view_delete_description()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.admin_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => dispatch({ type: 'delete-view' })}
            >
              {m.admin_view_delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
