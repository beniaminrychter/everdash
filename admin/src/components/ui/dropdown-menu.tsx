import { Menu } from '@base-ui/react/menu';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

export const DropdownMenu = Menu.Root;

export function DropdownMenuTrigger({
  className,
  ...props
}: Omit<ComponentProps<typeof Menu.Trigger>, 'className'> & { className?: string }) {
  return <Menu.Trigger className={cn('dropdown-menu-trigger', className)} {...props} />;
}

export function DropdownMenuContent({
  className,
  align = 'start',
  ...props
}: Omit<ComponentProps<typeof Menu.Popup>, 'className'> & {
  className?: string;
  align?: ComponentProps<typeof Menu.Positioner>['align'];
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="dropdown-menu-positioner" sideOffset={5} align={align}>
        <Menu.Popup className={cn('dropdown-menu-content', className)} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: Omit<ComponentProps<typeof Menu.Item>, 'className'> & { className?: string }) {
  return <Menu.Item className={cn('dropdown-menu-item', className)} {...props} />;
}
