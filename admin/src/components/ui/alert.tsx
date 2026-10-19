import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Alert({ className, ...props }: HTMLAttributes<HTMLOutputElement>) {
  return <output className={cn('alert', className)} {...props} />;
}
