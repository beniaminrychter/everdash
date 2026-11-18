export type JsonTokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'punctuation'
  | 'whitespace'
  | 'invalid';

export interface JsonToken {
  kind: JsonTokenKind;
  value: string;
}

const whitespacePattern = /\s/;
const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const wordPattern = /^[A-Za-z_][A-Za-z0-9_]*/;
const punctuationChars = new Set(['{', '}', '[', ']', ':', ',']);

function skipWhitespace(text: string, start: number): number {
  let index = start;

  while (index < text.length && whitespacePattern.test(text[index]!)) {
    index += 1;
  }

  return index;
}

function readStringEnd(text: string, start: number): number {
  let index = start + 1;

  while (index < text.length) {
    const ch = text[index]!;

    if (ch === '\\') {
      index += index + 1 < text.length ? 2 : 1;
      continue;
    }

    if (ch === '"') {
      return index + 1;
    }

    if (ch === '\n' || ch === '\r') {
      return index;
    }

    index += 1;
  }

  return index;
}

function pushTokenLines(lines: JsonToken[][], kind: JsonTokenKind, value: string) {
  if (!value) {
    return;
  }

  const parts = value.split('\n');

  parts.forEach((part, partIndex) => {
    if (partIndex > 0) {
      lines.push([]);
    }

    if (part.length > 0) {
      lines[lines.length - 1]!.push({ kind, value: part });
    }
  });
}

/**
 * Tokenizes raw JSON text into per-line highlighted tokens without failing on incomplete or
 * invalid syntax so live editing keeps colors intact.
 */
export function tokenizeJsonLines(text: string): JsonToken[][] {
  const lines: JsonToken[][] = [[]];
  let index = 0;

  while (index < text.length) {
    const ch = text[index]!;

    if (whitespacePattern.test(ch)) {
      const end = skipWhitespace(text, index);

      pushTokenLines(lines, 'whitespace', text.slice(index, end));
      index = end;
      continue;
    }

    if (ch === '"') {
      const end = readStringEnd(text, index);
      const nextNonWhitespace = skipWhitespace(text, end);
      const isKey = text[nextNonWhitespace] === ':';

      pushTokenLines(lines, isKey ? 'key' : 'string', text.slice(index, end));
      index = end;
      continue;
    }

    if (punctuationChars.has(ch)) {
      pushTokenLines(lines, 'punctuation', ch);
      index += 1;
      continue;
    }

    const rest = text.slice(index);
    const numberMatch = numberPattern.exec(rest);

    if (numberMatch) {
      pushTokenLines(lines, 'number', numberMatch[0]);
      index += numberMatch[0].length;
      continue;
    }

    const wordMatch = wordPattern.exec(rest);

    if (wordMatch) {
      const word = wordMatch[0];
      const kind: JsonTokenKind =
        word === 'true' || word === 'false' ? 'boolean' : word === 'null' ? 'null' : 'invalid';

      pushTokenLines(lines, kind, word);
      index += word.length;
      continue;
    }

    pushTokenLines(lines, 'invalid', ch);
    index += 1;
  }

  return lines;
}
