import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export function ViewInspector() {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);

  if (!view) {
    return null;
  }

  const cardCount = view.cards?.length ?? 0;
  const badgeCount = view.badges?.length ?? 0;

  return (
    <InspectorPanel eyebrow="View settings" title={view.title || 'Untitled view'}>
      <InspectorField
        label="View name"
        htmlFor="view-name"
        error={view.title.trim() ? undefined : 'Give the view a name.'}
      >
        <Input
          id="view-name"
          value={view.title}
          onChange={(event) => dispatch({ type: 'rename-view', title: event.target.value })}
        />
      </InspectorField>
      <p className="text-muted-foreground text-xs">
        {cardCount} {cardCount === 1 ? 'card' : 'cards'} · {badgeCount}{' '}
        {badgeCount === 1 ? 'badge' : 'badges'}
      </p>
      <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
        Click a card or badge in the preview to edit it.
      </p>
    </InspectorPanel>
  );
}
