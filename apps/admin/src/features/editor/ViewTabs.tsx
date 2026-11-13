import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDraft } from '@/app/DraftContext';
import { ViewMenu } from './ViewMenu';

interface ViewTabsProps {
  onRename: () => void;
}

export function ViewTabs({ onRename }: ViewTabsProps) {
  const { state, dispatch } = useDraft();

  return (
    <>
      <h1 className="sr-only">Editor</h1>
      <Tabs
        value={state.viewId}
        onValueChange={(viewId) => dispatch({ type: 'select-view', viewId })}
        className="min-w-0"
      >
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {state.document.views.map((view) => (
            <TabsTrigger key={view.id} value={view.id} className="max-w-40 flex-none px-3">
              <span className="truncate">{view.title || 'Untitled'}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <ViewMenu onRename={onRename} />
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground shrink-0"
        onClick={() => dispatch({ type: 'add-view' })}
      >
        + View
      </Button>
    </>
  );
}
