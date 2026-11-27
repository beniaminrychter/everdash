import type { KeyboardEvent } from 'react';
import { useMemo, useRef } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { cn } from '@/lib/utils';
import { tokenizeJsonLines } from './jsonHighlight';
import type { JsonTokenKind } from './jsonHighlight';

interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errorLine?: number | null;
  'aria-label'?: string;
}

const tokenClasses: Record<JsonTokenKind, string> = {
  key: 'text-sky-700 dark:text-sky-400',
  string: 'text-emerald-700 dark:text-emerald-400',
  number: 'text-amber-700 dark:text-amber-400',
  boolean: 'text-violet-700 dark:text-violet-400 font-medium',
  null: 'text-rose-700 dark:text-rose-400 italic',
  punctuation: 'text-muted-foreground',
  whitespace: '',
  invalid: 'text-destructive underline decoration-wavy',
};

const sharedTypography =
  'font-mono text-[13px] leading-5 tracking-normal [font-variant-ligatures:none] [tab-size:2]';

export function JsonCodeEditor({
  value,
  onChange,
  errorLine = null,
  'aria-label': ariaLabel,
}: JsonCodeEditorProps) {
  const resolvedAriaLabel = ariaLabel ?? m.admin_json_editor_aria();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tokenLines = useMemo(() => tokenizeJsonLines(value), [value]);

  function applyEdit(nextValue: string, selectionStart: number, selectionEnd = selectionStart) {
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      const element = textareaRef.current;

      if (!element) {
        return;
      }

      element.selectionStart = selectionStart;
      element.selectionEnd = selectionEnd;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget;
    const { selectionStart, selectionEnd } = element;

    if (event.key === 'Tab') {
      event.preventDefault();

      if (selectionStart === selectionEnd && !event.shiftKey) {
        const nextValue = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;

        applyEdit(nextValue, selectionStart + 2);

        return;
      }

      const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const blockEndSearch = value.indexOf('\n', selectionEnd);
      const blockEnd = blockEndSearch === -1 ? value.length : blockEndSearch;
      const lines = value.slice(blockStart, blockEnd).split('\n');
      let deltaFirst = 0;
      let deltaTotal = 0;

      const updated = lines.map((line, index) => {
        if (event.shiftKey) {
          const spaces = line.startsWith('  ') ? 2 : line.startsWith(' ') ? 1 : 0;

          if (index === 0) {
            deltaFirst = -spaces;
          }

          deltaTotal -= spaces;

          return line.slice(spaces);
        }

        if (index === 0) {
          deltaFirst = 2;
        }

        deltaTotal += 2;

        return `  ${line}`;
      });

      const nextValue = `${value.slice(0, blockStart)}${updated.join('\n')}${value.slice(blockEnd)}`;
      const nextStart = Math.max(blockStart, selectionStart + deltaFirst);
      const nextEnd = Math.max(nextStart, selectionEnd + deltaTotal);

      applyEdit(nextValue, nextStart, nextEnd);

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentPrefix = value.slice(lineStart, selectionStart);
      const baseIndent = /^ */.exec(currentPrefix)?.[0] ?? '';
      const trimmedBefore = currentPrefix.trimEnd();
      const opensBlock = trimmedBefore.endsWith('{') || trimmedBefore.endsWith('[');
      const nextChar = value[selectionEnd];
      const closesBlock =
        (trimmedBefore.endsWith('{') && nextChar === '}') ||
        (trimmedBefore.endsWith('[') && nextChar === ']');
      const indent = opensBlock ? `${baseIndent}  ` : baseIndent;

      if (closesBlock) {
        const insertion = `\n${indent}\n${baseIndent}`;
        const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;

        applyEdit(nextValue, selectionStart + 1 + indent.length);

        return;
      }

      const insertion = `\n${indent}`;
      const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;

      applyEdit(nextValue, selectionStart + insertion.length);
    }
  }

  return (
    <div
      data-json-editor
      className={cn(
        'border-input bg-muted/30 focus-within:border-ring focus-within:ring-ring/50 min-h-40 flex-1 overflow-auto rounded-md border transition-[color,box-shadow] focus-within:ring-[3px]',
        errorLine !== null && 'border-destructive/60',
      )}
    >
      <div className="flex min-h-full w-max min-w-full">
        <div
          aria-hidden="true"
          className="border-border/70 bg-muted/90 text-muted-foreground sticky left-0 z-10 min-w-11 shrink-0 border-r px-3 py-3 text-right select-none"
        >
          {tokenLines.map((_, lineIndex) => {
            const lineNumber = lineIndex + 1;
            const isError = lineNumber === errorLine;

            return (
              <div
                key={lineNumber}
                className={cn(
                  sharedTypography,
                  'h-5 tabular-nums',
                  isError && 'text-destructive font-semibold',
                )}
              >
                {lineNumber}
              </div>
            );
          })}
        </div>
        <div className="relative grid min-w-0 flex-1">
          <pre
            aria-hidden="true"
            className={cn(
              sharedTypography,
              'pointer-events-none col-start-1 row-start-1 m-0 p-3 whitespace-pre',
            )}
          >
            {tokenLines.map((tokens, lineIndex) => {
              const lineNumber = lineIndex + 1;
              const isError = lineNumber === errorLine;

              return (
                <div key={lineNumber} className={cn('h-5', isError && 'bg-destructive/12')}>
                  {tokens.length === 0
                    ? ' '
                    : tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} className={tokenClasses[token.kind]}>
                          {token.value}
                        </span>
                      ))}
                </div>
              );
            })}
          </pre>
          <textarea
            ref={textareaRef}
            aria-label={resolvedAriaLabel}
            aria-invalid={errorLine !== null || undefined}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              sharedTypography,
              'caret-foreground selection:bg-primary/25 col-start-1 row-start-1 m-0 resize-none overflow-hidden border-0 bg-transparent p-3 whitespace-pre text-transparent outline-none',
            )}
          />
        </div>
      </div>
    </div>
  );
}
