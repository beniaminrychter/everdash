import { Trash2Icon } from 'lucide-react';
import type { BadgeConfig } from '@everdash/contracts/config/types';
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
          Add badge
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'select', selection: { kind: 'view' } })}
        >
          Cancel
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
        Delete badge
      </Button>
    );

  return (
    <InspectorPanel
      eyebrow={pending ? 'New temperature badge' : 'Temperature badge'}
      title={badge.name || badge.entity || 'Choose an entity'}
      footer={footer}
      preview
      done={!pending}
    >
      <InspectorField
        label="Temperature sensor"
        htmlFor="badge-entity"
        error={entityInvalid ? 'Choose a sensor entity.' : undefined}
      >
        <EntityCombobox
          id="badge-entity"
          value={badge.entity}
          domain="sensor"
          onChange={(entity) => change(patch(badge, { entity }))}
        />
      </InspectorField>
      <InspectorField label="Display name" htmlFor="badge-name">
        <Input
          id="badge-name"
          placeholder="Use Home Assistant name"
          value={badge.name ?? ''}
          onChange={(event) => change(patch(badge, { name: event.target.value || undefined }))}
        />
      </InspectorField>
      <InspectorField label="Icon">
        <IconGrid
          label="Badge icon"
          value={badge.icon}
          onChange={(icon) => change(patch(badge, { icon }))}
        />
      </InspectorField>
    </InspectorPanel>
  );
}
