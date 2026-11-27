import { viewCards } from '@everdash/contracts/config/sections';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { pluralize } from '@/lib/i18n';
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
  const summaryParts = [
    pluralize(cardCount, {
      one: m.admin_count_cards_one,
      few: m.admin_count_cards_few,
      many: m.admin_count_cards_many,
    }),
    pluralize(badgeCount, {
      one: m.admin_count_badges_one,
      few: m.admin_count_badges_few,
      many: m.admin_count_badges_many,
    }),
  ];

  if (sectionCount > 0) {
    summaryParts.push(
      pluralize(sectionCount, {
        one: m.admin_count_sections_one,
        few: m.admin_count_sections_few,
        many: m.admin_count_sections_many,
      }),
    );
  }

  return (
    <InspectorPanel
      eyebrow={m.admin_inspector_view_settings()}
      title={view.title || m.admin_untitled_view()}
    >
      <InspectorField
        label={m.admin_inspector_view_name()}
        htmlFor="view-name"
        error={view.title.trim() ? undefined : m.admin_inspector_view_name_required()}
      >
        <Input
          id="view-name"
          value={view.title}
          onChange={(event) => dispatch({ type: 'rename-view', title: event.target.value })}
        />
      </InspectorField>
      <p className="text-muted-foreground text-xs">{summaryParts.join(' · ')}</p>
      <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
        {m.admin_inspector_view_hint()}
      </p>
    </InspectorPanel>
  );
}
