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
          <AlertDialogTitle>Unapplied JSON changes</AlertDialogTitle>
          <AlertDialogDescription>
            Apply the JSON to the editor draft, or discard the raw edits before leaving this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={onDiscard}>
            Discard JSON
          </AlertDialogAction>
          <AlertDialogAction onClick={onApply}>Validate and apply</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
