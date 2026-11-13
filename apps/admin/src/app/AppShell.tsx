import { EditorPage } from '@/features/editor/EditorPage';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from './AppSidebar';
import { DraftAlerts } from './DraftAlerts';
import { PageHeader } from './PageHeader';
import { routeTitles, useHashRoute } from './useHashRoute';

export function AppShell({ origin }: { origin: string }) {
  const [route, navigate] = useHashRoute();

  return (
    <SidebarProvider>
      <AppSidebar route={route} onNavigate={navigate} origin={origin} />
      <SidebarInset className="min-w-0">
        {route === 'editor' ? (
          <EditorPage />
        ) : (
          <>
            <PageHeader>
              <h1 className="text-base font-medium">{routeTitles[route]}</h1>
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4">
              <DraftAlerts />
              {/* Task 8 replaces this placeholder with the real page for each route. */}
              <p className="text-muted-foreground text-sm">{routeTitles[route]} is coming next.</p>
            </main>
          </>
        )}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
