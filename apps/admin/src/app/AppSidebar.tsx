import {
  BracesIcon,
  ChevronsUpDownIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  TabletIcon,
  UserIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { routeTitles } from './useHashRoute';
import type { Route } from './useHashRoute';

interface AppSidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
  origin: string;
}

const groups: { label: string; items: { route: Route; icon: LucideIcon }[] }[] = [
  {
    label: 'Dashboard',
    items: [
      { route: 'editor', icon: LayoutDashboardIcon },
      { route: 'settings', icon: SettingsIcon },
      { route: 'json', icon: BracesIcon },
    ],
  },
  {
    label: 'Setup',
    items: [
      { route: 'tablets', icon: TabletIcon },
      { route: 'home-assistant', icon: HouseIcon },
    ],
  },
];

async function logout() {
  await fetch('/api/manage/auth/logout', {
    method: 'POST',
    headers: { 'X-EverDash-Request': '1' },
  });
  window.location.assign('/admin/');
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

export function AppSidebar({ route, onNavigate, origin }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
            E
          </div>
          <div className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">EverDash</span>
            {origin && (
              <span className="text-muted-foreground truncate text-xs">{hostOf(origin)}</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ route: item, icon: Icon }) => (
                  <SidebarMenuItem key={item}>
                    <SidebarMenuButton
                      isActive={route === item}
                      tooltip={routeTitles[item]}
                      onClick={() => onNavigate(item)}
                    >
                      <Icon />
                      <span>{routeTitles[item]}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                <SidebarMenuButton tooltip="Account">
                  <UserIcon />
                  <span>Administrator</span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-48">
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
