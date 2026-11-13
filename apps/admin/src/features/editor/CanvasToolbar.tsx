import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDraft } from '@/app/DraftContext';
import { AddCardDialog } from './AddCardDialog';

export function CanvasToolbar() {
  const { dispatch } = useDraft();
  const [chooserOpen, setChooserOpen] = useState(false);

  return (
    <div className="mb-3 flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Live preview
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'start-badge' })}>
          + Badge
        </Button>
        <Button variant="outline" size="sm" onClick={() => setChooserOpen(true)}>
          + Add card
        </Button>
      </div>
      <AddCardDialog open={chooserOpen} onOpenChange={setChooserOpen} />
    </div>
  );
}
