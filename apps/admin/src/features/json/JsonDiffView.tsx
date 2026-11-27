import { useMemo } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { diffJsonLines } from '@/app/draft/jsonDiff';
import { cn } from '@/lib/utils';

interface JsonDiffViewProps {
  previous: string;
  current: string;
}

const lineTypography =
  'font-mono text-[13px] leading-5 tracking-normal [font-variant-ligatures:none] [tab-size:2]';

export function JsonDiffView({ previous, current }: JsonDiffViewProps) {
  const diff = useMemo(() => diffJsonLines(previous, current), [previous, current]);

  if (!diff.hasChanges) {
    return (
      <div
        data-json-diff
        aria-label={m.admin_json_diff_aria()}
        className="border-input bg-muted/30 text-muted-foreground flex min-h-40 flex-1 items-center justify-center rounded-md border p-6 text-center text-sm"
      >
        {m.admin_json_diff_no_changes()}
      </div>
    );
  }

  return (
    <div
      data-json-diff
      aria-label={m.admin_json_diff_aria()}
      className="border-input bg-muted/30 flex min-h-40 flex-1 flex-col overflow-hidden rounded-md border"
    >
      <div className="border-border/70 bg-muted/70 flex flex-wrap items-center justify-end border-b px-3 py-2 text-xs">
        <div className="flex items-center gap-2 font-mono font-medium tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-400">
            {m.admin_json_diff_added({ count: diff.added })}
          </span>
          <span className="text-rose-700 dark:text-rose-400">
            {m.admin_json_diff_removed({ count: diff.removed })}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-max py-2">
          {diff.lines.map((line, index) => (
            <div
              key={`${line.kind}-${line.oldLineNumber ?? 'n'}-${line.newLineNumber ?? 'n'}-${index}`}
              data-diff-line={line.kind}
              className={cn(
                lineTypography,
                'flex min-h-5 whitespace-pre',
                line.kind === 'added' && 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-200',
                line.kind === 'removed' && 'bg-rose-500/15 text-rose-950 dark:text-rose-200',
              )}
            >
              <span
                aria-hidden="true"
                className="text-muted-foreground/80 w-10 shrink-0 px-2 text-right tabular-nums select-none"
              >
                {line.oldLineNumber ?? ''}
              </span>
              <span
                aria-hidden="true"
                className="border-border/60 text-muted-foreground/80 w-10 shrink-0 border-r px-2 text-right tabular-nums select-none"
              >
                {line.newLineNumber ?? ''}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'w-6 shrink-0 text-center font-semibold select-none',
                  line.kind === 'added' && 'text-emerald-700 dark:text-emerald-400',
                  line.kind === 'removed' && 'text-rose-700 dark:text-rose-400',
                )}
              >
                {line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}
              </span>
              <span className="pr-4">{line.text || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
