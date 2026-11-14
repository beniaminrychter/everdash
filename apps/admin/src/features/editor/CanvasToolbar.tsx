import { Button } from '@/components/ui/button';
import { useDraft } from '@/app/DraftContext';

export function CanvasToolbar() {
  const { state, dispatch } = useDraft();
  const pendingCard = state.selection.kind === 'pending-card';

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
        {/* The new card shows in the preview at once; its type is chosen in the inspector. */}
        <Button
          variant="outline"
          size="sm"
          disabled={pendingCard}
          onClick={() => dispatch({ type: 'start-card', kind: 'light' })}
        >
          + Add card
        </Button>
      </div>
    </div>
  );
}
