import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = Omit<ComponentProps<typeof ButtonPrimitive>, 'className'> & {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn('button', `button-${variant}`, `button-${size}`, className)}
      {...props}
    />
  );
}
