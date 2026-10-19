import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

type ListProps = Omit<ComponentProps<typeof TabsPrimitive.List>, 'className'> & {
  className?: string;
};
type TriggerProps = Omit<ComponentProps<typeof TabsPrimitive.Tab>, 'className'> & {
  className?: string;
};
type ContentProps = Omit<ComponentProps<typeof TabsPrimitive.Panel>, 'className'> & {
  className?: string;
};

export function TabsList({ className, ...props }: ListProps) {
  return <TabsPrimitive.List className={cn('tabs-list', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TriggerProps) {
  return <TabsPrimitive.Tab className={cn('tabs-trigger', className)} {...props} />;
}

export function TabsContent({ className, ...props }: ContentProps) {
  return <TabsPrimitive.Panel className={cn('tabs-content', className)} {...props} />;
}
