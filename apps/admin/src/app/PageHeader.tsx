import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SaveControls } from './SaveControls';

/** The shell's top bar: sidebar toggle, page-specific content, and the save cluster. */
export function PageHeader({ children }: { children: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <SaveControls />
    </header>
  );
}
