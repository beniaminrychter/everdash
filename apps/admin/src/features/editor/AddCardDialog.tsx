import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CardKind } from '@/app/draft/builder';
import { getCardKinds } from './cardKinds';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: CardKind) => void;
}

/** The first step of adding a card: choose its type. The editor opens next, with a live preview. */
export function AddCardDialog({ open, onOpenChange, onPick }: AddCardDialogProps) {
  const cardKinds = getCardKinds();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogDescription className="text-xs">{m.admin_editor_step_1_of_2()}</DialogDescription>
          <DialogTitle>{m.admin_editor_add_card()}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cardKinds.map(({ kind, label, description }) => (
            <button
              key={kind}
              type="button"
              className="hover:border-ring hover:bg-accent focus-visible:ring-ring flex flex-col items-start gap-2 rounded-lg border p-3 text-left outline-none focus-visible:ring-2"
              onClick={() => {
                onOpenChange(false);
                onPick(kind);
              }}
            >
              <span className="text-sm font-medium">{label}</span>
              {description && <span className="text-muted-foreground text-xs">{description}</span>}
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{m.admin_cancel()}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
