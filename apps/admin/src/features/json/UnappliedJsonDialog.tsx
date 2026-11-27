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

interface UnappliedJsonDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onApply: () => void;
}

export function UnappliedJsonDialog({
  open,
  onKeepEditing,
  onDiscard,
  onApply,
}: UnappliedJsonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onKeepEditing()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.admin_json_unapplied_title()}</AlertDialogTitle>
          <AlertDialogDescription>{m.admin_json_unapplied_description()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.admin_json_keep_editing()}</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={onDiscard}>
            {m.admin_json_discard()}
          </AlertDialogAction>
          <AlertDialogAction onClick={onApply}>
            {m.admin_json_validate_and_apply()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
