import { viewCards } from '@everdash/contracts/config/sections';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export function ViewInspector() {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);

  if (!view) {
    return null;
  }

  const cardCount = viewCards(view).length;
  const badgeCount = view.badges?.length ?? 0;
  const sectionCount = view.sections?.length ?? 0;

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
        {sectionCount > 0 && ` · ${sectionCount} ${sectionCount === 1 ? 'section' : 'sections'}`}
      </p>
      <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
        Click a card, badge or section title in the preview to edit it. Sections are optional: add
        one with + Section to group cards under a heading.
      </p>
    </InspectorPanel>
  );
}
