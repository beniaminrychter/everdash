import { ArrowLeft } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  onBack,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onBack?: () => void;
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
            {onBack && (
              <button type="button" className="button button-ghost button-sm" onClick={onBack}>
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <Dialog.Title className="card-title">{title}</Dialog.Title>
            <Dialog.Close className="button button-ghost button-sm">Close</Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
