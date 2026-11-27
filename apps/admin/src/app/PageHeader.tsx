import type { ReactNode } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SaveControls } from './SaveControls';

const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B';

/** The sidebar toggle, named for what it will do and with its keyboard shortcut. */
function SidebarToggle() {
  const { state, isMobile } = useSidebar();
  const label = isMobile
    ? m.admin_sidebar_open()
    : state === 'expanded'
      ? m.admin_sidebar_collapse()
      : m.admin_sidebar_expand();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger
          className="text-muted-foreground hover:text-foreground -ml-1 size-10 md:size-8"
          aria-label={label}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label} <span className="ml-1 opacity-60">{shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/** The shell's top bar: sidebar toggle, page-specific content, and the save cluster. */
export function PageHeader({ children }: { children: ReactNode }) {
  return (
    <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b px-4 py-2 md:h-14 md:grid-cols-[auto_minmax(0,1fr)_auto] md:py-0">
      <div className="flex items-center gap-2">
        <SidebarToggle />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      </div>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
      <div className="col-span-2 md:col-span-1">
        <SaveControls />
      </div>
    </header>
  );
}
