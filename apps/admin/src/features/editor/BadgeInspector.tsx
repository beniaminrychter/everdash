import { Trash2Icon } from 'lucide-react';
import type { BadgeConfig } from '@everdash/contracts/config/types';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { isEntityForDomain } from './cardKinds';
import type { DeleteTarget } from './DeleteItemDialog';
import { EntityCombobox } from './EntityCombobox';
import { IconGrid } from './IconGrid';
import { InspectorField, InspectorPanel } from './InspectorPanel';

export type BadgeSelection =
  | { kind: 'badge'; index: number }
  | { kind: 'pending-badge'; badge: BadgeConfig };

interface BadgeInspectorProps {
  selection: BadgeSelection;
  onRequestDelete: (target: DeleteTarget) => void;
}

function patch(badge: BadgeConfig, changes: Record<string, unknown>): BadgeConfig {
  return { ...badge, ...changes } as BadgeConfig;
}

export function BadgeInspector({ selection, onRequestDelete }: BadgeInspectorProps) {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);
  const badge =
    selection.kind === 'pending-badge' ? selection.badge : view?.badges?.[selection.index];

  if (!badge) {
    return null;
  }

  const pending = selection.kind === 'pending-badge';
  const entityInvalid = badge.entity.length > 0 && !isEntityForDomain(badge.entity, 'sensor');
  const canAdd = isEntityForDomain(badge.entity, 'sensor');

  function change(next: BadgeConfig) {
    if (selection.kind === 'pending-badge') {
      dispatch({ type: 'update-pending', value: next });

      return;
    }

    dispatch({ type: 'update-badge', index: selection.index, badge: next });
  }

  const footer =
    selection.kind === 'pending-badge' ? (
      <>
        <Button disabled={!canAdd} onClick={() => dispatch({ type: 'commit-pending' })}>
          {m.admin_inspector_add_badge()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'select', selection: { kind: 'view' } })}
        >
          {m.admin_cancel()}
        </Button>
      </>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive ml-auto"
        onClick={() => onRequestDelete({ kind: 'badge', index: selection.index })}
      >
        <Trash2Icon />
        {m.admin_inspector_delete_badge()}
      </Button>
    );

  return (
    <InspectorPanel
      eyebrow={pending ? m.admin_inspector_new_badge_eyebrow() : m.admin_inspector_badge_eyebrow()}
      title={badge.name || badge.entity || m.admin_inspector_choose_entity()}
      footer={footer}
      preview
      done={!pending}
    >
      <InspectorField
        label={m.admin_inspector_temp_sensor()}
        htmlFor="badge-entity"
        error={entityInvalid ? m.admin_inspector_choose_sensor() : undefined}
      >
        <EntityCombobox
          id="badge-entity"
          value={badge.entity}
          domain="sensor"
          onChange={(entity) => change(patch(badge, { entity }))}
        />
      </InspectorField>
      <InspectorField label={m.admin_inspector_display_name()} htmlFor="badge-name">
        <Input
          id="badge-name"
          placeholder={m.admin_inspector_placeholder_ha_name()}
          value={badge.name ?? ''}
          onChange={(event) => change(patch(badge, { name: event.target.value || undefined }))}
        />
      </InspectorField>
      <InspectorField label={m.admin_inspector_icon()}>
        <IconGrid
          label={m.admin_inspector_badge_icon()}
          value={badge.icon}
          onChange={(icon) => change(patch(badge, { icon }))}
        />
      </InspectorField>
    </InspectorPanel>
  );
}
