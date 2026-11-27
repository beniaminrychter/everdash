import type { ReactNode } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useEditorDialog } from './editorDialogContext';
import { ItemPreview } from './ItemPreview';

interface InspectorPanelProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Shows the live preview of the edited item beside the form (below it on narrow windows). */
  preview?: boolean;
  /** Ends the footer with Cancel and Done; items still being added have their own Add and Cancel. */
  done?: boolean;
  /** Holds Done back, for an item that cannot be left as it is. */
  doneDisabled?: boolean;
}

/** Shared frame for every editor: a header, the form, an optional preview and an action footer. */
export function InspectorPanel({
  eyebrow,
  title,
  children,
  footer,
  preview = false,
  done = true,
  doneDisabled = false,
}: InspectorPanelProps) {
  const actions = useEditorDialog();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-5 py-4 pr-12">
        <DialogDescription className="text-xs">{eyebrow}</DialogDescription>
        <DialogTitle className="truncate text-base">{title}</DialogTitle>
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 text-sm md:max-w-[24rem]">
          {children}
        </div>
        {preview && (
          <div className="order-first shrink-0 bg-[#e4eaf1] text-slate-900 md:order-none md:flex-1 md:overflow-y-auto">
            <ItemPreview />
          </div>
        )}
      </div>
      {(footer || done) && (
        <div className="flex items-center gap-2 border-t px-5 py-3">
          {footer}
          {done && (
            <>
              <Button
                variant="ghost"
                className={footer ? undefined : 'ml-auto'}
                onClick={actions.cancel}
              >
                {m.admin_cancel()}
              </Button>
              <Button disabled={doneDisabled} onClick={actions.done}>
                {m.admin_done()}
              </Button>
            </>
          )}
        </div>
      )}
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
