import type { DashboardDocument } from '@everdash/contracts/config/types';
import { validateDashboard } from '@everdash/contracts/config/validate';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';

export interface JsonValidationResult {
  ok: boolean;
  issues: string[];
  errorLine: number | null;
  document?: DashboardDocument;
}

function lineAtOffset(text: string, offset: number): number {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 1;

  for (let index = 0; index < clamped; index += 1) {
    if (text[index] === '\n') {
      line += 1;
    }
  }

  return line;
}

function extractLineFromError(text: string, message: string): number | null {
  const lineMatch = /line\s+(\d+)/i.exec(message);

  if (lineMatch) {
    const parsed = Number(lineMatch[1]);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  const posMatch = /position\s+(\d+)/i.exec(message);

  if (posMatch) {
    const offset = Number(posMatch[1]);

    return Number.isFinite(offset) ? lineAtOffset(text, offset) : null;
  }

  return null;
}

/**
 * Fallback scanner used when the JS engine omits line/position from a JSON SyntaxError.
 * Tracks container stack and expected token state to pinpoint the likely offending line.
 */
function locateSyntaxErrorLine(text: string): number | null {
  type Context =
    | { kind: 'object'; expect: 'key-or-end' | 'colon' | 'value' | 'comma-or-end' }
    | { kind: 'array'; expect: 'value-or-end' | 'comma-or-end' };

  const stack: Context[] = [];
  let index = 0;
  let rootDone = false;

  const skipWs = () => {
    while (index < text.length && /\s/.test(text[index]!)) {
      index += 1;
    }
  };

  const readString = (): number | null => {
    index += 1;

    while (index < text.length) {
      const ch = text[index]!;

      if (ch === '\\') {
        index += 2;
        continue;
      }

      if (ch === '"') {
        index += 1;

        return null;
      }

      if (ch === '\n' || ch === '\r') {
        return lineAtOffset(text, index);
      }

      index += 1;
    }

    return lineAtOffset(text, text.length);
  };

  const advanceAfterValue = () => {
    const top = stack[stack.length - 1];

    if (!top) {
      rootDone = true;

      return;
    }

    top.expect = 'comma-or-end';
  };

  while (true) {
    skipWs();

    if (index >= text.length) {
      return lineAtOffset(text, Math.max(0, text.length - 1));
    }

    const ch = text[index]!;
    const top = stack[stack.length - 1];

    if (rootDone && !top) {
      return lineAtOffset(text, index);
    }

    if (top?.kind === 'object') {
      if (top.expect === 'key-or-end') {
        if (ch === '}') {
          stack.pop();
          index += 1;
          advanceAfterValue();
          continue;
        }

        if (ch === '"') {
          const badLine = readString();

          if (badLine !== null) {
            return badLine;
          }

          top.expect = 'colon';
          continue;
        }

        return lineAtOffset(text, index);
      }

      if (top.expect === 'colon') {
        if (ch !== ':') {
          return lineAtOffset(text, index);
        }

        index += 1;
        top.expect = 'value';
        continue;
      }

      if (top.expect === 'comma-or-end') {
        if (ch === '}') {
          stack.pop();
          index += 1;
          advanceAfterValue();
          continue;
        }

        if (ch === ',') {
          index += 1;
          top.expect = 'key-or-end';
          continue;
        }

        return lineAtOffset(text, index);
      }
    }

    if (top?.kind === 'array') {
      if (top.expect === 'comma-or-end') {
        if (ch === ']') {
          stack.pop();
          index += 1;
          advanceAfterValue();
          continue;
        }

        if (ch === ',') {
          index += 1;
          top.expect = 'value-or-end';
          continue;
        }

        return lineAtOffset(text, index);
      }

      if (top.expect === 'value-or-end' && ch === ']') {
        stack.pop();
        index += 1;
        advanceAfterValue();
        continue;
      }
    }

    if (ch === '{') {
      stack.push({ kind: 'object', expect: 'key-or-end' });
      index += 1;
      continue;
    }

    if (ch === '[') {
      stack.push({ kind: 'array', expect: 'value-or-end' });
      index += 1;
      continue;
    }

    if (ch === '"') {
      const badLine = readString();

      if (badLine !== null) {
        return badLine;
      }

      advanceAfterValue();
      continue;
    }

    const num = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(index));

    if (num) {
      index += num[0].length;
      advanceAfterValue();
      continue;
    }

    if (text.startsWith('true', index)) {
      index += 4;
      advanceAfterValue();
      continue;
    }

    if (text.startsWith('false', index)) {
      index += 5;
      advanceAfterValue();
      continue;
    }

    if (text.startsWith('null', index)) {
      index += 4;
      advanceAfterValue();
      continue;
    }

    return lineAtOffset(text, index);
  }
}

function locateSchemaIssueLine(text: string, path: string): number | null {
  if (!path) {
    return null;
  }

  const keyMatch = /([A-Za-z0-9_]+)(?:\[\d+\])?$/.exec(path);

  if (!keyMatch) {
    return null;
  }

  const escapedKey = keyMatch[1]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`"${escapedKey}"\\s*:`);
  const lines = text.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    if (pattern.test(lines[index]!)) {
      return index + 1;
    }
  }

  return null;
}

/** Validates raw dashboard JSON text live, returning schema issues and the offending line number. */
export function validateJsonText(text: string): JsonValidationResult {
  if (!text.trim()) {
    return { ok: false, issues: [m.admin_json_enter_json()], errorLine: 1 };
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    const result = validateDashboard(parsed);

    if (!result.ok) {
      const issues = result.issues.map(
        (issue) => `${issue.path || m.admin_dashboard_label()}: ${issue.message}`,
      );
      const firstPath = result.issues[0]?.path ?? '';

      return {
        ok: false,
        issues,
        errorLine: locateSchemaIssueLine(text, firstPath),
      };
    }

    return { ok: true, issues: [], errorLine: null, document: result.document };
  } catch (error) {
    const message = error instanceof Error ? error.message : m.admin_json_enter_valid();
    const errorLine = extractLineFromError(text, message) ?? locateSyntaxErrorLine(text);

    return {
      ok: false,
      issues: [errorLine ? m.admin_json_line_error({ line: errorLine, message }) : message],
      errorLine,
    };
  }
}
