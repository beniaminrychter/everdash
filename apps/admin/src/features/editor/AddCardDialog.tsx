import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDraft } from '@/app/DraftContext';
import { cardKinds } from './cardKinds';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardDialog({ open, onOpenChange }: AddCardDialogProps) {
  const { dispatch } = useDraft();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a card</DialogTitle>
          <DialogDescription>Choose what the new card controls or shows.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {cardKinds.map(({ kind, label, description, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                dispatch({ type: 'start-card', kind });
                onOpenChange(false);
              }}
              className="hover:bg-accent focus-visible:ring-ring/50 flex flex-col items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px]"
            >
              <span className="bg-muted text-foreground grid size-9 place-items-center rounded-md">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="text-muted-foreground block text-xs">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
