import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useDraft } from '@/app/DraftContext';
import { BadgeInspector } from './BadgeInspector';
import { CardInspector } from './CardInspector';
import type { DeleteTarget } from './DeleteItemDialog';
import { useMediaQuery } from './useMediaQuery';
import { ViewInspector } from './ViewInspector';

interface InspectorProps {
  /** Opens the sheet below lg even when no card or badge is selected (view rename). */
  viewSheetOpen: boolean;
  onViewSheetOpenChange: (open: boolean) => void;
  onRequestDelete: (target: DeleteTarget) => void;
}

function InspectorContent({ onRequestDelete }: Pick<InspectorProps, 'onRequestDelete'>) {
  const { state } = useDraft();
  const { selection } = state;

  switch (selection.kind) {
    case 'card': {
      return (
        <CardInspector
          key={`${state.viewId}-card-${selection.index}`}
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'badge': {
      return (
        <BadgeInspector
          key={`${state.viewId}-badge-${selection.index}`}
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'pending-card': {
      return (
        <CardInspector
          key={`pending-${selection.card.type}`}
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    case 'pending-badge': {
      return (
        <BadgeInspector
          key="pending-badge"
          selection={selection}
          onRequestDelete={onRequestDelete}
        />
      );
    }

    default: {
      return <ViewInspector />;
    }
  }
}

export function Inspector({
  viewSheetOpen,
  onViewSheetOpenChange,
  onRequestDelete,
}: InspectorProps) {
  const { state, dispatch } = useDraft();
  const desktop = useMediaQuery('(min-width: 1024px)');

  if (desktop) {
    return (
      <aside aria-label="Inspector" className="bg-background w-80 shrink-0 border-l">
        <InspectorContent onRequestDelete={onRequestDelete} />
      </aside>
    );
  }

  return (
    <Sheet
      open={state.selection.kind !== 'view' || viewSheetOpen}
      onOpenChange={(open) => {
        if (open) {
          return;
        }

        onViewSheetOpenChange(false);
        dispatch({ type: 'select', selection: { kind: 'view' } });
      }}
    >
      <SheetContent side="right" className="w-80 gap-0 p-0 sm:max-w-80">
        <SheetTitle className="sr-only">Inspector</SheetTitle>
        <SheetDescription className="sr-only">Edit the selected item.</SheetDescription>
        <InspectorContent onRequestDelete={onRequestDelete} />
      </SheetContent>
    </Sheet>
  );
}
