import { Button } from '@/components/ui/button';
import { useDraft } from '@/app/DraftContext';
import { unfinishedCardIssue } from '@/app/draft/draftReducer';
import { hasIncomplete } from '@/app/draft/incomplete';
import { focusInspectorField } from './focusInspectorField';

export function CanvasToolbar() {
  const { state, dispatch } = useDraft();
  const pendingCard = hasIncomplete(state.document);

  const unfinished = unfinishedCardIssue(state);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Live preview
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'start-badge' })}>
            + Badge
          </Button>
          {/* Sections are optional titled groups of cards; the new one is named in the inspector. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch({ type: 'add-section' });
              focusInspectorField('section-name');
            }}
          >
            + Section
          </Button>
          {/* The new card is added to the view at once; its type and entity are chosen in the inspector. */}
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
      {unfinished && (
        <output className="mb-3 block text-sm text-amber-700 dark:text-amber-400">
          {unfinished}
        </output>
      )}
    </>
  );
}
