import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDraft } from '@/app/DraftContext';
import { hasIncomplete } from '@/app/draft/incomplete';
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
      eyebrow="Section"
      title={section.title || 'Untitled section'}
      footer={
        <>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Move section up"
            disabled={position === 0}
            onClick={() => dispatch({ type: 'move-section', id, offset: -1 })}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Move section down"
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
            Delete section
          </Button>
        </>
      }
    >
      <InspectorField
        label="Section name"
        htmlFor="section-name"
        error={section.title.trim() ? undefined : 'Give the section a name.'}
      >
        <Input
          id="section-name"
          value={section.title}
          onChange={(event) => dispatch({ type: 'rename-section', id, title: event.target.value })}
        />
      </InspectorField>
      <p className="text-muted-foreground text-xs">
        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={hasIncomplete(state.document)}
        onClick={() => dispatch({ type: 'start-card', kind: 'light', section: id })}
      >
        <PlusIcon />
        Add card to this section
      </Button>
    </InspectorPanel>
  );
}
