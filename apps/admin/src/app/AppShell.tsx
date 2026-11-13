import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from './AppSidebar';
import { DraftAlerts } from './DraftAlerts';
import { SaveControls } from './SaveControls';
import { routeTitles, useHashRoute } from './useHashRoute';

export function AppShell({ origin }: { origin: string }) {
  const [route, navigate] = useHashRoute();

  return (
    <SidebarProvider>
      <AppSidebar route={route} onNavigate={navigate} origin={origin} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-base font-medium">{routeTitles[route]}</h1>
          <div className="ml-auto">
            <SaveControls />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <DraftAlerts />
          {/* Tasks 7 and 8 replace this placeholder with the real page for each route. */}
          <p className="text-muted-foreground text-sm">{routeTitles[route]} is coming next.</p>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
