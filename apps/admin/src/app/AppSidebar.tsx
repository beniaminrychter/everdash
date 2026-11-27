import {
  BracesIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  GlobeIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  TabletIcon,
  UserIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { adminHomeUrl, apiUrl } from '@/lib/api';
import { useAdminLocale } from '@/lib/i18n';
import type { AdminLanguagePreference } from '@/lib/i18n';
import { routeTitle } from './useHashRoute';
import type { Route } from './useHashRoute';

interface AppSidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
  origin: string;
  connectionMode?: 'oauth' | 'supervisor';
  ingress?: boolean;
}

const groups: {
  id: 'dashboard' | 'setup';
  label: () => string;
  items: { route: Route; icon: LucideIcon }[];
}[] = [
  {
    id: 'dashboard',
    label: () => m.admin_sidebar_group_dashboard(),
    items: [
      { route: 'editor', icon: LayoutDashboardIcon },
      { route: 'settings', icon: SettingsIcon },
      { route: 'json', icon: BracesIcon },
    ],
  },
  {
    id: 'setup',
    label: () => m.admin_sidebar_group_setup(),
    items: [
      { route: 'devices', icon: TabletIcon },
      { route: 'home-assistant', icon: HouseIcon },
    ],
  },
];

async function logout() {
  try {
    await fetch(apiUrl('api/manage/auth/logout'), {
      method: 'POST',
      headers: { 'X-EverDash-Request': '1' },
    });
  } catch {
    toast.error(m.admin_sidebar_logout_error());

    return;
  }

  window.location.assign(adminHomeUrl());
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

export function AppSidebar({
  route,
  onNavigate,
  origin,
  connectionMode,
  ingress,
}: AppSidebarProps) {
  const { locale, preference, setPreference } = useAdminLocale();
  const subtitle = origin
    ? hostOf(origin)
    : connectionMode === 'supervisor'
      ? 'Home Assistant'
      : '';
  const activeLanguageLabel =
    locale === 'pl' ? m.admin_language_polish() : m.admin_language_english();
  const languageOptions: { value: AdminLanguagePreference; label: string }[] = [
    { value: 'auto', label: m.admin_language_auto() },
    { value: 'en', label: m.admin_language_english() },
    { value: 'pl', label: m.admin_language_polish() },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Same height as the page's top bar, so the two line up across the window. */}
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={routeTitle('editor')}
              className="h-10"
              onClick={() => onNavigate('editor')}
            >
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
                E
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">EverDash</span>
                {subtitle && (
                  <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label()}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ route: item, icon: Icon }) => {
                  const title = routeTitle(item);

                  return (
                    <SidebarMenuItem key={item}>
                      <SidebarMenuButton
                        isActive={route === item}
                        tooltip={title}
                        onClick={() => onNavigate(item)}
                      >
                        <Icon />
                        <span>{title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip={m.admin_sidebar_language()}
                  aria-label={m.admin_sidebar_language()}
                >
                  <GlobeIcon />
                  <span>{activeLanguageLabel}</span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-48">
                {languageOptions.map((option) => (
                  <DropdownMenuItem key={option.value} onSelect={() => setPreference(option.value)}>
                    <span className="flex-1">{option.label}</span>
                    {preference === option.value && <CheckIcon className="ml-2 size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          {!ingress && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={m.admin_sidebar_account()}>
                    <UserIcon />
                    <span>{m.admin_sidebar_administrator()}</span>
                    <ChevronsUpDownIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-48">
                  <DropdownMenuItem onSelect={() => logout()}>
                    <LogOutIcon />
                    {m.admin_sidebar_logout()}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
