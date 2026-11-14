import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SaveControls } from './SaveControls';

const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B';

/** The sidebar toggle, named for what it will do and with its keyboard shortcut. */
function SidebarToggle() {
  const { state, isMobile } = useSidebar();
  const label = isMobile
    ? 'Open sidebar'
    : state === 'expanded'
      ? 'Collapse sidebar'
      : 'Expand sidebar';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger
          className="text-muted-foreground hover:text-foreground -ml-1 size-8"
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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarToggle />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <SaveControls />
    </header>
  );
}
