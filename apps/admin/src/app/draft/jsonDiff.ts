export interface JsonDiffLine {
  kind: 'context' | 'added' | 'removed';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  text: string;
}

export interface JsonDiffResult {
  lines: JsonDiffLine[];
  added: number;
  removed: number;
  hasChanges: boolean;
}

const MAX_LCS_CELLS = 250_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Computes longest common subsequence matched index pairs for two string arrays.
 * Returns pairs `[prevIndex, currIndex]` in ascending order.
 */
function lcsMatches(previous: readonly string[], current: readonly string[]): [number, number][] {
  const rows = previous.length;
  const cols = current.length;

  if (rows === 0 || cols === 0) {
    return [];
  }

  const dp = Array.from({ length: rows + 1 }, () => new Uint32Array(cols + 1));

  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      dp[row]![col] =
        previous[row] === current[col]
          ? dp[row + 1]![col + 1]! + 1
          : Math.max(dp[row + 1]![col]!, dp[row]![col + 1]!);
    }
  }

  const matches: [number, number][] = [];
  let row = 0;
  let col = 0;

  while (row < rows && col < cols) {
    if (previous[row] === current[col]) {
      matches.push([row, col]);
      row += 1;
      col += 1;
    } else if (dp[row + 1]![col]! >= dp[row]![col + 1]!) {
      row += 1;
    } else {
      col += 1;
    }
  }

  return matches;
}

/** Optional identity key used to pair modified objects inside an array (e.g. views, sections, cards). */
function itemIdentity(value: unknown): string | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (typeof value.id === 'string' && value.id.length > 0) {
    return `id:${value.id}`;
  }

  if (typeof value.type === 'string' && typeof value.entity === 'string') {
    return `card:${value.type}:${value.entity}`;
  }

  return null;
}

function countArrayChanges(
  previous: readonly unknown[],
  current: readonly unknown[],
  countValues: (left: unknown, right: unknown) => number,
): number {
  const prevSerialized = previous.map((item) => JSON.stringify(item));
  const currSerialized = current.map((item) => JSON.stringify(item));

  if (
    prevSerialized.length === currSerialized.length &&
    prevSerialized.every((entry, index) => entry === currSerialized[index])
  ) {
    return 0;
  }

  const matched = lcsMatches(prevSerialized, currSerialized);
  const matchedPrev = new Set(matched.map(([prevIndex]) => prevIndex));
  const matchedCurr = new Set(matched.map(([, currIndex]) => currIndex));

  const unmatchedPrev: { value: unknown; serialized: string }[] = [];
  const unmatchedCurr: { value: unknown; serialized: string }[] = [];

  for (let index = 0; index < previous.length; index += 1) {
    if (!matchedPrev.has(index)) {
      unmatchedPrev.push({ value: previous[index], serialized: prevSerialized[index]! });
    }
  }

  for (let index = 0; index < current.length; index += 1) {
    if (!matchedCurr.has(index)) {
      unmatchedCurr.push({ value: current[index], serialized: currSerialized[index]! });
    }
  }

  let total = 0;

  // Items present in both unmatched pools with identical JSON were moved/reordered (1 change each).
  const remainingCurrBySerialized = new Map<string, number[]>();

  for (let index = 0; index < unmatchedCurr.length; index += 1) {
    const key = unmatchedCurr[index]!.serialized;
    const list = remainingCurrBySerialized.get(key) ?? [];

    list.push(index);
    remainingCurrBySerialized.set(key, list);
  }

  const usedPrev = new Set<number>();
  const usedCurr = new Set<number>();

  for (let index = 0; index < unmatchedPrev.length; index += 1) {
    const key = unmatchedPrev[index]!.serialized;
    const candidates = remainingCurrBySerialized.get(key);
    const matchIndex = candidates?.shift();

    if (matchIndex !== undefined) {
      usedPrev.add(index);
      usedCurr.add(matchIndex);
      total += 1;
    }
  }

  // Pair remaining modified objects by stable identity (`id` or `type`+`entity`) before positional pairing.
  const remainingCurrByIdentity = new Map<string, number[]>();

  for (let index = 0; index < unmatchedCurr.length; index += 1) {
    if (usedCurr.has(index)) {
      continue;
    }

    const identity = itemIdentity(unmatchedCurr[index]!.value);

    if (identity) {
      const list = remainingCurrByIdentity.get(identity) ?? [];

      list.push(index);
      remainingCurrByIdentity.set(identity, list);
    }
  }

  for (let index = 0; index < unmatchedPrev.length; index += 1) {
    if (usedPrev.has(index)) {
      continue;
    }

    const identity = itemIdentity(unmatchedPrev[index]!.value);

    if (!identity) {
      continue;
    }

    const matchIndex = remainingCurrByIdentity.get(identity)?.shift();

    if (matchIndex !== undefined) {
      usedPrev.add(index);
      usedCurr.add(matchIndex);
      total += countValues(unmatchedPrev[index]!.value, unmatchedCurr[matchIndex]!.value);
    }
  }

  const leftoverPrev = unmatchedPrev.filter((_, index) => !usedPrev.has(index));
  const leftoverCurr = unmatchedCurr.filter((_, index) => !usedCurr.has(index));
  const pairedCount = Math.min(leftoverPrev.length, leftoverCurr.length);

  for (let index = 0; index < pairedCount; index += 1) {
    total += countValues(leftoverPrev[index]!.value, leftoverCurr[index]!.value);
  }

  total += Math.abs(leftoverPrev.length - leftoverCurr.length);

  return total;
}

/**
 * Counts the number of actual structural differences between two JSON values.
 * Editing a field and reverting it back returns 0; changing the same field multiple times counts as 1.
 */
export function countJsonChanges(previous: unknown, current: unknown): number {
  if (Object.is(previous, current)) {
    return 0;
  }

  if (
    previous === null ||
    current === null ||
    typeof previous !== 'object' ||
    typeof current !== 'object'
  ) {
    return 1;
  }

  if (Array.isArray(previous) || Array.isArray(current)) {
    if (!Array.isArray(previous) || !Array.isArray(current)) {
      return 1;
    }

    return countArrayChanges(previous, current, countJsonChanges);
  }

  if (!isPlainObject(previous) || !isPlainObject(current)) {
    return 1;
  }

  const keys = new Set<string>();

  for (const [key, value] of Object.entries(previous)) {
    if (value !== undefined) {
      keys.add(key);
    }
  }

  for (const [key, value] of Object.entries(current)) {
    if (value !== undefined) {
      keys.add(key);
    }
  }

  let total = 0;

  for (const key of keys) {
    const hasPrev = previous[key] !== undefined;
    const hasCurr = current[key] !== undefined;

    total += !hasPrev || !hasCurr ? 1 : countJsonChanges(previous[key], current[key]);
  }

  return total;
}

/** Counts actual unsaved differences between two serialized JSON documents. */
export function countSerializedJsonChanges(baselineJson: string, currentJson: string): number {
  if (baselineJson === currentJson) {
    return 0;
  }

  try {
    const previous: unknown = JSON.parse(baselineJson);
    const current: unknown = JSON.parse(currentJson);

    return Math.max(1, countJsonChanges(previous, current));
  } catch {
    return 1;
  }
}

/** Computes a unified line-by-line diff between two JSON strings. */
export function diffJsonLines(previousText: string, currentText: string): JsonDiffResult {
  const prevLines = previousText.split('\n');
  const currLines = currentText.split('\n');

  if (previousText === currentText) {
    return {
      lines: currLines.map((text, index) => ({
        kind: 'context',
        oldLineNumber: index + 1,
        newLineNumber: index + 1,
        text,
      })),
      added: 0,
      removed: 0,
      hasChanges: false,
    };
  }

  let prefix = 0;
  const maxPrefix = Math.min(prevLines.length, currLines.length);

  while (prefix < maxPrefix && prevLines[prefix] === currLines[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  const maxSuffix = Math.min(prevLines.length - prefix, currLines.length - prefix);

  while (
    suffix < maxSuffix &&
    prevLines[prevLines.length - 1 - suffix] === currLines[currLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const lines: JsonDiffLine[] = [];

  for (let index = 0; index < prefix; index += 1) {
    lines.push({
      kind: 'context',
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
      text: prevLines[index]!,
    });
  }

  const middlePrev = prevLines.slice(prefix, prevLines.length - suffix);
  const middleCurr = currLines.slice(prefix, currLines.length - suffix);
  let added = 0;
  let removed = 0;

  if (middlePrev.length * middleCurr.length <= MAX_LCS_CELLS) {
    const matches = lcsMatches(middlePrev, middleCurr);
    let prevCursor = 0;
    let currCursor = 0;

    for (const [matchPrev, matchCurr] of matches) {
      while (prevCursor < matchPrev) {
        lines.push({
          kind: 'removed',
          oldLineNumber: prefix + prevCursor + 1,
          newLineNumber: null,
          text: middlePrev[prevCursor]!,
        });
        removed += 1;
        prevCursor += 1;
      }

      while (currCursor < matchCurr) {
        lines.push({
          kind: 'added',
          oldLineNumber: null,
          newLineNumber: prefix + currCursor + 1,
          text: middleCurr[currCursor]!,
        });
        added += 1;
        currCursor += 1;
      }

      lines.push({
        kind: 'context',
        oldLineNumber: prefix + prevCursor + 1,
        newLineNumber: prefix + currCursor + 1,
        text: middlePrev[prevCursor]!,
      });
      prevCursor += 1;
      currCursor += 1;
    }

    while (prevCursor < middlePrev.length) {
      lines.push({
        kind: 'removed',
        oldLineNumber: prefix + prevCursor + 1,
        newLineNumber: null,
        text: middlePrev[prevCursor]!,
      });
      removed += 1;
      prevCursor += 1;
    }

    while (currCursor < middleCurr.length) {
      lines.push({
        kind: 'added',
        oldLineNumber: null,
        newLineNumber: prefix + currCursor + 1,
        text: middleCurr[currCursor]!,
      });
      added += 1;
      currCursor += 1;
    }
  } else {
    for (let index = 0; index < middlePrev.length; index += 1) {
      lines.push({
        kind: 'removed',
        oldLineNumber: prefix + index + 1,
        newLineNumber: null,
        text: middlePrev[index]!,
      });
      removed += 1;
    }

    for (let index = 0; index < middleCurr.length; index += 1) {
      lines.push({
        kind: 'added',
        oldLineNumber: null,
        newLineNumber: prefix + index + 1,
        text: middleCurr[index]!,
      });
      added += 1;
    }
  }

  for (let index = 0; index < suffix; index += 1) {
    const oldIndex = prevLines.length - suffix + index;
    const newIndex = currLines.length - suffix + index;

    lines.push({
      kind: 'context',
      oldLineNumber: oldIndex + 1,
      newLineNumber: newIndex + 1,
      text: prevLines[oldIndex]!,
    });
  }

  return {
    lines,
    added,
    removed,
    hasChanges: added > 0 || removed > 0,
  };
}
