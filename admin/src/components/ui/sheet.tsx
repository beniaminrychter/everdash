import { Dialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="sheet-backdrop" />
        <Dialog.Popup className="sheet-popup">
          <div className="sheet-heading">
            <Dialog.Title className="card-title">{title}</Dialog.Title>
            <Dialog.Close className="button button-ghost button-sm">Close</Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
