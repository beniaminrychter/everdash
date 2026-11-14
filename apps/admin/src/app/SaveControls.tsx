import { useState } from 'react';
import { EllipsisVerticalIcon } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDraft } from './DraftContext';
import { draftIssues, isDirty } from './draft/draftReducer';

type Confirmation = 'discard' | 'restore' | null;

export function SaveControls() {
  const { state, dispatch, save, restorePrevious, previousAvailable, saving } = useDraft();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const dirty = isDirty(state);
  const issues = draftIssues(state);
  const canSave = dirty && issues.length === 0 && !saving;

  return (
    <div className="flex items-center gap-2">
      {dirty ? (
        <Badge variant="secondary">
          {state.changes} unsaved {state.changes === 1 ? 'change' : 'changes'}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">All changes saved</span>
      )}
      {/* A save in flight must finish first, or its result would be applied over the discard. */}
      <Button
        variant="outline"
        disabled={!dirty || saving}
        onClick={() => setConfirmation('discard')}
      >
        Discard
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled={!canSave} onClick={() => save()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </span>
        </TooltipTrigger>
        {issues.length > 0 && <TooltipContent>{issues[0]}</TooltipContent>}
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More save options">
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!previousAvailable || saving}
            onSelect={() => setConfirmation('restore')}
          >
            Restore previous version
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === 'restore'
                ? 'Restore the previous version?'
                : 'Discard dashboard changes?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === 'restore'
                ? 'This loads the previously saved dashboard into the editor and replaces your current draft. Save to make it live.'
                : 'This restores the last saved dashboard and removes every unsaved edit.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmation === 'restore') {
                  restorePrevious();
                } else {
                  dispatch({ type: 'discard' });
                }
              }}
            >
              {confirmation === 'restore' ? 'Restore previous version' : 'Discard changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
