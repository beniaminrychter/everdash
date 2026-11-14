import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface InspectorPanelProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for every inspector: a header, scrolling fields and an action footer. */
export function InspectorPanel({ eyebrow, title, children, footer }: InspectorPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-4 pr-12">
        <div className="text-muted-foreground text-xs">{eyebrow}</div>
        <div className="truncate font-semibold">{title}</div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">{children}</div>
      {footer && <div className="flex items-center gap-2 border-t p-4">{footer}</div>}
    </div>
  );
}

interface InspectorFieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function InspectorField({ label, htmlFor, hint, error, children }: InspectorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}
