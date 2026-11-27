import { DevicesPage } from '@/features/devices/DevicesPage';
import { EditorPage } from '@/features/editor/EditorPage';
import { HomeAssistantPage } from '@/features/home-assistant/HomeAssistantPage';
import { JsonPage } from '@/features/json/JsonPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useAdminLocale } from '@/lib/i18n';
import { AppSidebar } from './AppSidebar';
import { DraftAlerts } from './DraftAlerts';
import { PageHeader } from './PageHeader';
import { useAutoSidebar } from './useAutoSidebar';
import { routeTitle, useHashRoute } from './useHashRoute';
import type { Route } from './useHashRoute';

interface AppShellProps {
  origin: string;
  connectionMode?: 'oauth' | 'supervisor';
  ingress?: boolean;
  tabletPort?: number;
}

function RoutePage({
  route,
  origin,
  connectionMode,
  ingress,
  tabletPort,
}: {
  route: Exclude<Route, 'editor'>;
  origin: string;
  connectionMode?: 'oauth' | 'supervisor';
  ingress?: boolean;
  tabletPort?: number;
}) {
  switch (route) {
    case 'settings': {
      return <SettingsPage />;
    }

    case 'json': {
      return <JsonPage />;
    }

    case 'devices': {
      return <DevicesPage ingress={ingress} tabletPort={tabletPort} />;
    }

    default: {
      return <HomeAssistantPage origin={origin} connectionMode={connectionMode} />;
    }
  }
}

export function AppShell({ origin, connectionMode, ingress, tabletPort }: AppShellProps) {
  useAdminLocale();
  const [route, navigate] = useHashRoute();
  const sidebar = useAutoSidebar();

  return (
    <SidebarProvider open={sidebar.open} onOpenChange={sidebar.onOpenChange}>
      <AppSidebar
        route={route}
        onNavigate={navigate}
        origin={origin}
        connectionMode={connectionMode}
        ingress={ingress}
      />
      <SidebarInset className="min-w-0">
        {route === 'editor' ? (
          <EditorPage />
        ) : route === 'json' ? (
          <div className="flex h-svh min-h-0 flex-col">
            <PageHeader>
              <h1 className="text-base font-medium">{routeTitle(route)}</h1>
            </PageHeader>
            <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:flex md:flex-col md:overflow-hidden">
              <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
                <DraftAlerts />
                <JsonPage />
              </div>
            </main>
          </div>
        ) : (
          <div className="flex h-svh min-h-0 flex-col">
            <PageHeader>
              <h1 className="text-base font-medium">{routeTitle(route)}</h1>
            </PageHeader>
            <main className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                <DraftAlerts />
                <RoutePage
                  route={route}
                  origin={origin}
                  connectionMode={connectionMode}
                  ingress={ingress}
                  tabletPort={tabletPort}
                />
              </div>
            </main>
          </div>
        )}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
