import { Field as FieldPrimitive } from '@base-ui/react/field';
import type { ComponentProps, ReactNode } from 'react';

export function Field({ children }: { children: ReactNode }) {
  return <FieldPrimitive.Root className="field">{children}</FieldPrimitive.Root>;
}

export function FieldLabel({
  className,
  ...props
}: Omit<ComponentProps<typeof FieldPrimitive.Label>, 'className'> & { className?: string }) {
  return <FieldPrimitive.Label className={`field-label ${className ?? ''}`} {...props} />;
}
