import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export function ViewInspector() {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);

  if (!view) {
    return null;
  }

  return (
    <InspectorPanel title={view.title || m.admin_untitled_view()}>
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
    </InspectorPanel>
  );
}
