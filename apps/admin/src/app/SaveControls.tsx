import { useState } from 'react';
import { EllipsisVerticalIcon } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { pluralize } from '@/lib/i18n';
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
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 leading-tight">
        {dirty ? (
          <Badge variant="secondary" className="h-auto whitespace-normal">
            {pluralize(state.changes, {
              one: m.admin_unsaved_change_one,
              few: m.admin_unsaved_change_few,
              many: m.admin_unsaved_change_many,
            })}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">{m.admin_all_changes_saved()}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* A save in flight must finish first, or its result would be applied over the discard. */}
        <Button
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => setConfirmation('discard')}
        >
          {m.admin_discard()}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button disabled={!canSave} onClick={() => save()}>
                {saving ? m.admin_saving() : m.admin_save()}
              </Button>
            </span>
          </TooltipTrigger>
          {issues.length > 0 && <TooltipContent>{issues[0]}</TooltipContent>}
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={m.admin_more_save_options()}>
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!previousAvailable || saving}
              onSelect={() => setConfirmation('restore')}
            >
              {m.admin_restore_previous_version()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === 'restore'
                ? m.admin_restore_previous_title()
                : m.admin_discard_title()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === 'restore'
                ? m.admin_restore_previous_description()
                : m.admin_discard_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.admin_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmation === 'restore') {
                  restorePrevious();
                } else {
                  dispatch({ type: 'discard' });
                }
              }}
            >
              {confirmation === 'restore'
                ? m.admin_restore_previous_version()
                : m.admin_discard_changes()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
