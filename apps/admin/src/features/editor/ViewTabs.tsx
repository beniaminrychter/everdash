import { useEffect, useRef } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDraft } from '@/app/DraftContext';
import { ViewMenu } from './ViewMenu';

interface ViewTabsProps {
  onRename: () => void;
}

interface ViewTabProps {
  id: string;
  title: string;
  active: boolean;
}

function ViewTab({ id, title, active }: ViewTabProps) {
  const trigger = useRef<HTMLButtonElement>(null);

  // A newly added or selected view can sit past the scrolled edge; keep it in sight.
  useEffect(() => {
    if (active) {
      trigger.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [active]);

  return (
    <TabsTrigger
      ref={trigger}
      value={id}
      className="data-[state=active]:border-border dark:data-[state=active]:border-border h-full max-w-40 flex-none px-3 data-[state=active]:font-semibold"
    >
      <span className="truncate">{title || m.admin_untitled()}</span>
    </TabsTrigger>
  );
}

export function ViewTabs({ onRename }: ViewTabsProps) {
  const { state, dispatch } = useDraft();

  return (
    <>
      <h1 className="sr-only">{m.admin_route_editor()}</h1>
      <Tabs
        value={state.viewId}
        onValueChange={(viewId) => dispatch({ type: 'select-view', viewId })}
        className="min-w-0"
      >
        {/* The scroller pads its edges, so the active pill's shadow and focus ring are never clipped. */}
        <div className="-m-1 min-w-0 [scrollbar-width:none] overflow-x-auto p-1 [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max justify-start gap-1 p-1">
            {state.document.views.map((view) => (
              <ViewTab
                key={view.id}
                id={view.id}
                title={view.title}
                active={view.id === state.viewId}
              />
            ))}
          </TabsList>
        </div>
      </Tabs>
      <ViewMenu onRename={onRename} />
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground shrink-0"
        onClick={() => dispatch({ type: 'add-view' })}
      >
        {m.admin_editor_add_view_plus()}
      </Button>
    </>
  );
}
