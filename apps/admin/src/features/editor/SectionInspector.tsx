import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { hasIncomplete } from '@/app/draft/incomplete';
import { pluralize } from '@/lib/i18n';
import type { DeleteTarget } from './DeleteItemDialog';
import { InspectorField, InspectorPanel } from './InspectorPanel';

interface SectionInspectorProps {
  id: string;
  onRequestDelete: (target: DeleteTarget) => void;
}

export function SectionInspector({ id, onRequestDelete }: SectionInspectorProps) {
  const { state, dispatch } = useDraft();
  const view = state.document.views.find((item) => item.id === state.viewId);
  const sections = view?.sections ?? [];
  const position = sections.findIndex((item) => item.id === id);
  const section = sections[position];

  if (!section) {
    return null;
  }

  const cardCount = section.cards?.length ?? 0;

  return (
    <InspectorPanel
      title={section.title || m.editor_untitled_section()}
      preview
      footer={
        <>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={m.admin_inspector_move_section_up()}
            disabled={position === 0}
            onClick={() => dispatch({ type: 'move-section', id, offset: -1 })}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={m.admin_inspector_move_section_down()}
            disabled={position === sections.length - 1}
            onClick={() => dispatch({ type: 'move-section', id, offset: 1 })}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive ml-auto"
            onClick={() => onRequestDelete({ kind: 'section', id })}
          >
            <Trash2Icon />
            {m.admin_inspector_delete_section()}
          </Button>
        </>
      }
    >
      <InspectorField
        label={m.admin_inspector_section_name()}
        htmlFor="section-name"
        error={section.title.trim() ? undefined : m.admin_inspector_section_name_required()}
      >
        <Input
          id="section-name"
          value={section.title}
          onChange={(event) => dispatch({ type: 'rename-section', id, title: event.target.value })}
        />
      </InspectorField>
      <p className="text-muted-foreground text-xs">
        {pluralize(cardCount, {
          one: m.admin_count_cards_one,
          few: m.admin_count_cards_few,
          many: m.admin_count_cards_many,
        })}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={hasIncomplete(state.document)}
        onClick={() => dispatch({ type: 'start-card', kind: 'light', section: id })}
      >
        <PlusIcon />
        {m.admin_inspector_add_card_to_section()}
      </Button>
    </InspectorPanel>
  );
}
