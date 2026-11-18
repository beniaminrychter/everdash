import { DevicesPage } from '@/features/devices/DevicesPage';
import { EditorPage } from '@/features/editor/EditorPage';
import { HomeAssistantPage } from '@/features/home-assistant/HomeAssistantPage';
import { JsonPage } from '@/features/json/JsonPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from './AppSidebar';
import { DraftAlerts } from './DraftAlerts';
import { PageHeader } from './PageHeader';
import { routeTitles, useHashRoute } from './useHashRoute';
import type { Route } from './useHashRoute';

function RoutePage({ route, origin }: { route: Exclude<Route, 'editor'>; origin: string }) {
  switch (route) {
    case 'settings': {
      return <SettingsPage />;
    }

    case 'json': {
      return <JsonPage />;
    }

    case 'devices': {
      return <DevicesPage />;
    }

    default: {
      return <HomeAssistantPage origin={origin} />;
    }
  }
}

export function AppShell({ origin }: { origin: string }) {
  const [route, navigate] = useHashRoute();

  return (
    <SidebarProvider>
      <AppSidebar route={route} onNavigate={navigate} origin={origin} />
      <SidebarInset className="min-w-0">
        {route === 'editor' ? (
          <EditorPage />
        ) : route === 'json' ? (
          <div className="flex h-svh min-h-0 flex-col">
            <PageHeader>
              <h1 className="text-base font-medium">{routeTitles[route]}</h1>
            </PageHeader>
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
                <DraftAlerts />
                <JsonPage />
              </div>
            </main>
          </div>
        ) : (
          <div className="flex h-svh min-h-0 flex-col">
            <PageHeader>
              <h1 className="text-base font-medium">{routeTitles[route]}</h1>
            </PageHeader>
            <main className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                <DraftAlerts />
                <RoutePage route={route} origin={origin} />
              </div>
            </main>
          </div>
        )}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
